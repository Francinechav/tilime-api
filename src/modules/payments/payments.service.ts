import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaymentStatus } from '../../common/enums/payment-status.enum';

import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';

import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

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

    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,

    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(InventoryMovement)
    private readonly inventoryRepository: Repository<InventoryMovement>,
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

      return_url: `${process.env.FRONTEND_URL}/payments/success`,

      customization: {
        title: 'Tilime Honey',
        description: 'Honey purchase payment',
      },
    };

    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.paychangu.com/payment',

        payload,

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
        reference: string;
      };
    };

    const paymentData = responseData.data;

    if (paymentData.status !== 'success') {
      throw new BadRequestException('Payment verification failed');
    }

    payment.status = PaymentStatus.SUCCESS;

    payment.paychanguReference = paymentData.reference;

    payment.rawResponse = responseData;

    await this.paymentsRepository.save(payment);

    const order = payment.order;

    order.paymentStatus = PaymentStatus.SUCCESS;

    order.orderStatus = OrderStatus.PAID;

    await this.ordersRepository.save(order);

    for (const item of order.items) {
      const product = item.product;

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`${product.name} has insufficient stock`);
      }

      product.stockQuantity -= item.quantity;

      await this.productsRepository.save(product);

      const inventoryMovement = this.inventoryRepository.create({
        product,

        movementType: InventoryMovementType.WEBSITE_ORDER,

        quantity: item.quantity,

        notes: `Website order: ${order.orderNumber}`,
      });

      await this.inventoryRepository.save(inventoryMovement);
    }

    return {
      message: 'Payment verified successfully',
    };
  }
}
