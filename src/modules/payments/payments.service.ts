import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { EmailService } from '../emails/email.service';

import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';

import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly httpService: HttpService,

    private readonly dataSource: DataSource,

    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,

    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(InventoryMovement)
    private readonly inventoryRepository: Repository<InventoryMovement>,

    private readonly emailService: EmailService,
  ) {}

  async initiatePayment(dto: InitiatePaymentDto) {
    const order = await this.ordersRepository.findOne({
      where: {
        id: dto.orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Order already paid');
    }

    const txRef = `TX-${Date.now()}`;

    const payload = {
      amount: order.totalAmount,

      currency: 'MWK',

      email: order.customerEmail || 'customer@example.com',

      first_name: order.customerName,

      tx_ref: txRef,

      callback_url: `${process.env.APP_URL}/payments/callback`,

      return_url: `${process.env.FRONTEND_URL}/payments/verify`,

      customization: {
        title: 'Tilime Honey',
        description: 'Honey purchase payment',
      },
    };

    const response = await firstValueFrom(
      this.httpService.post('https://api.paychangu.com/payment', payload, {
        headers: {
          Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,

          Accept: 'application/json',
        },
      }),
    );

    const responseData = response.data as {
      data: {
        checkout_url: string;
      };
    };

    const payment = this.paymentsRepository.create({
      order,
      txRef,
      amount: order.totalAmount,
      rawResponse: responseData,
    });

    await this.paymentsRepository.save(payment);

    return {
      checkoutUrl: responseData.data.checkout_url,

      txRef,
    };
  }

  async verifyPayment(txRef: string) {
    const payment = await this.paymentsRepository.findOne({
      where: {
        txRef,
      },
      relations: {
        order: {
          items: {
            product: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    /*
     * Payment has already been completed.
     */
    if (payment.status === PaymentStatus.SUCCESS) {
      return {
        message: 'Payment already verified',
        status: PaymentStatus.SUCCESS,
      };
    }

    /*
     * Ask PayChangu for the current
     * payment status.
     */
    const response = await firstValueFrom(
      this.httpService.get(
        `https://api.paychangu.com/verify-payment/${txRef}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
            Accept: 'application/json',
          },
        },
      ),
    );

    const responseData = response.data as {
      data: {
        status: string;
        reference?: string;
      };
    };

    const paymentData = responseData.data;

    /*
     * PAYMENT FAILED
     */
    if (paymentData.status === 'failed') {
      payment.status = PaymentStatus.FAILED;

      payment.rawResponse = responseData;

      await this.paymentsRepository.save(payment);

      return {
        message: 'Payment failed',
        status: PaymentStatus.FAILED,
      };
    }

    /*
     * PAYMENT STILL PENDING
     */
    if (paymentData.status !== 'success') {
      payment.status = PaymentStatus.PENDING;

      payment.rawResponse = responseData;

      await this.paymentsRepository.save(payment);

      return {
        message: 'Payment is still pending',
        status: PaymentStatus.PENDING,
      };
    }

    /*
     * Tracks whether THIS request
     * actually completed the payment.
     *
     * This prevents duplicate emails
     * when webhook + callback + frontend
     * verification happen at the same time.
     */
    let paymentCompleted = false;

    /*
     * SUCCESSFUL PAYMENT
     *
     * Everything that changes stock,
     * inventory and order status happens
     * inside one transaction.
     */
    await this.dataSource.transaction(async (manager) => {
      /*
       * Lock the payment row.
       */
      const lockedPayment = await manager.findOne(Payment, {
        where: {
          id: payment.id,
        },
        relations: {
          order: {
            items: {
              product: true,
            },
          },
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!lockedPayment) {
        throw new NotFoundException('Payment not found');
      }

      /*
       * Another request may have
       * completed this payment while
       * this request was waiting for
       * the database lock.
       */
      if (lockedPayment.status === PaymentStatus.SUCCESS) {
        return;
      }

      const order = lockedPayment.order;

      /*
       * Lock and validate all products
       * before changing any stock.
       */
      const products = new Map<string, Product>();

      for (const item of order.items) {
        const product = await manager.findOne(Product, {
          where: {
            id: item.product.id,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!product) {
          throw new NotFoundException(`Product not found: ${item.product.id}`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `${product.name} has insufficient stock`,
          );
        }

        products.set(product.id, product);
      }

      /*
       * Deduct stock and create
       * inventory movements.
       */
      for (const item of order.items) {
        const product = products.get(item.product.id);

        if (!product) {
          throw new NotFoundException(`Product not found: ${item.product.id}`);
        }

        product.stockQuantity -= item.quantity;

        await manager.save(Product, product);

        const inventoryMovement = manager.create(InventoryMovement, {
          product,
          movementType: InventoryMovementType.WEBSITE_ORDER,
          quantity: -item.quantity,
          notes: `Website order: ${order.orderNumber}`,
        });

        await manager.save(InventoryMovement, inventoryMovement);
      }

      /*
       * Mark the payment as successful.
       */
      lockedPayment.status = PaymentStatus.SUCCESS;

      lockedPayment.paychanguReference = paymentData.reference;

      lockedPayment.rawResponse = responseData;

      await manager.save(Payment, lockedPayment);

      /*
       * Mark the order as paid.
       */
      order.paymentStatus = PaymentStatus.SUCCESS;

      order.orderStatus = OrderStatus.PAID;

      await manager.save(Order, order);

      /*
       * This request successfully
       * completed the payment.
       */
      paymentCompleted = true;
    });

    /*
     * Another request already completed
     * the payment.
     *
     * Do NOT send emails again.
     */
    if (!paymentCompleted) {
      return {
        message: 'Payment already verified',
        status: PaymentStatus.SUCCESS,
      };
    }

    /*
     * The transaction committed successfully.
     *
     * Only the request that actually
     * completed the payment sends emails.
     */
    const order = payment.order;

    await this.emailService.sendWebsiteOrderCustomerEmail(
      order.customerEmail!,
      order.orderNumber,
      Number(order.totalAmount),
    );

    await this.emailService.sendAdminWebsiteOrderEmail(
      order.orderNumber,
      order.customerName,
      Number(order.totalAmount),
    );

    return {
      message: 'Payment verified successfully',
      status: PaymentStatus.SUCCESS,
    };
  }
}
