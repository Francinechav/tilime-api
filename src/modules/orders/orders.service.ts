import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { PaymentsService } from '../payments/payments.service';

import { Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { Product } from '../products/entities/product.entity';

import { CreateOrderDto } from './dto/create-order.dto';

import { DeliveryMethod } from '../../common/enums/delivery-method.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { CreateWebsiteOrderDto } from './dto/create-website-order.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EmailService } from '../emails/email.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly emailService: EmailService,

    private readonly paymentsService: PaymentsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    let subtotal = 0;

    const orderItems: OrderItem[] = [];

    for (const item of dto.items) {
      const product = await this.productsRepository.findOne({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`${product.name} is out of stock`);
      }

      const itemSubtotal = Number(product.price) * item.quantity;

      subtotal += itemSubtotal;

      const orderItem = this.orderItemsRepository.create({
        product,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        subtotal: itemSubtotal,
      });

      orderItems.push(orderItem);
    }

    let deliveryFee = 0;

    if (dto.deliveryMethod === DeliveryMethod.DELIVERY) {
      deliveryFee = 5000;
    }

    const totalAmount = subtotal + deliveryFee;

    const orderNumber = `ORD-${Date.now()}`;

    const order = this.ordersRepository.create({
      orderNumber,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      deliveryMethod: dto.deliveryMethod,
      deliveryAddress: dto.deliveryAddress,
      pickupLocation: dto.pickupLocation,
      notes: dto.notes,
      subtotal,
      deliveryFee,
      totalAmount,
      items: orderItems,
    });

    const savedOrder: Order = await this.ordersRepository.save(order);

    await this.auditLogsService.createLog({
      action: 'CREATE_ORDER',

      entityType: 'ORDER',

      entityId: savedOrder.id,

      performedBy: savedOrder.customerEmail,

      after: {
        orderNumber: savedOrder.orderNumber,

        customer: savedOrder.customerName,

        total: savedOrder.totalAmount,

        status: savedOrder.orderStatus,
      },

      metadata: {
        type: 'Website Order',
      },
    });

    return savedOrder;
  }

  async findAllOrders(): Promise<Order[]> {
    return this.ordersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOneOrder(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.ordersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.orderStatus;

    order.orderStatus = status;

    const updatedOrder = await this.ordersRepository.save(order);

    await this.auditLogsService.createLog({
      action: 'UPDATE_ORDER_STATUS',

      entityType: 'ORDER',

      entityId: updatedOrder.id,

      before: {
        status: previousStatus,
      },

      after: {
        status,
      },

      metadata: {
        orderNumber: updatedOrder.orderNumber,
      },
    });

    return updatedOrder;
  }
  async getRecentOrders() {
    return this.ordersRepository.find({
      take: 5,

      order: {
        createdAt: 'DESC',
      },
    });
  }
  async createWebsiteOrder(dto: CreateWebsiteOrderDto) {
    const orderNumber = `ORD-${Date.now()}`;

    let totalAmount = 0;

    const orderItems: {
      product: Product;

      quantity: number;

      unitPrice: number;

      subtotal: number;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.productsRepository.findOne({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      totalAmount += Number(product.price) * item.quantity;

      orderItems.push({
        product,

        quantity: item.quantity,

        unitPrice: Number(product.price),

        subtotal: Number(product.price) * item.quantity,
      });
    }

    const subtotal = totalAmount;

    const order = this.ordersRepository.create({
      orderNumber,

      customerName: dto.customerName,

      customerEmail: dto.customerEmail,

      customerPhone: dto.customerPhone,

      deliveryAddress: dto.deliveryAddress,

      deliveryMethod: dto.deliveryMethod,

      subtotal,

      deliveryFee: 0,

      totalAmount,
    });
    const savedOrder = await this.ordersRepository.save(order);
    await this.emailService.sendWebsiteOrderCustomerEmail(
      savedOrder.customerEmail!,

      savedOrder.orderNumber,

      savedOrder.totalAmount,
    );

    await this.emailService.sendAdminWebsiteOrderEmail(
      savedOrder.orderNumber,

      savedOrder.customerName,

      savedOrder.totalAmount,
    );

    const createdItems = orderItems.map((item) =>
      this.orderItemsRepository.create({
        order: savedOrder,

        product: item.product,

        quantity: item.quantity,

        unitPrice: item.unitPrice,

        subtotal: item.subtotal,
      }),
    );

    await this.orderItemsRepository.save(createdItems);

    const payment = await this.paymentsService.initiatePayment({
      orderId: savedOrder.id,
    });

    return payment;
  }
}
