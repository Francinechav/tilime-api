import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Order } from '../orders/entities/order.entity';

import { Product } from '../products/entities/product.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { OrderItem } from '../orders/entities/order-item.entity';
import { PackagingRecord } from '../packaging/entities/packaging-record.entity';
import { SalesOperation } from '../sales-operations/entities/sales-operation.entity';
import { SalesOperationType } from '../../common/enums/sales-operation-type.enum';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import type { Response } from 'express';

import ExcelJS from 'exceljs';
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(PackagingRecord)
    private readonly packagingRepository: Repository<PackagingRecord>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(SalesOperation)
    private readonly salesOperationsRepository: Repository<SalesOperation>,
    @InjectRepository(InventoryMovement)
    private readonly inventoryRepository: Repository<InventoryMovement>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async getDashboardAnalytics() {
    const orders = await this.ordersRepository.find();

    const products = await this.productsRepository.find();

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const totalOrders = orders.length;

    const totalProducts = products.length;

    const lowStockProducts = products.filter(
      (product) => product.stockQuantity <= product.lowStockLevel,
    ).length;

    const recentOrders = orders.slice(0, 5);

    return {
      totalRevenue,

      totalOrders,

      totalProducts,

      lowStockProducts,

      recentOrders,
    };
  }
  async getMonthlyRevenue() {
    const orders = await this.ordersRepository.find({
      where: {
        paymentStatus: PaymentStatus.SUCCESS,
      },
    });

    const monthlyMap = new Map<string, number>();

    orders.forEach((order) => {
      const date = new Date(order.createdAt);

      const month = date.toLocaleString('default', {
        month: 'short',
      });

      const current = monthlyMap.get(month) || 0;

      monthlyMap.set(month, current + Number(order.totalAmount));
    });

    return Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }
  async getTopSellingProducts() {
    const items = await this.orderItemsRepository.find({
      relations: {
        product: true,
      },
    });

    const salesMap = new Map<
      string,
      {
        productName: string;

        quantity: number;
      }
    >();

    items.forEach((item) => {
      const existing = salesMap.get(item.product.id);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        salesMap.set(item.product.id, {
          productName: item.product.name,

          quantity: item.quantity,
        });
      }
    });

    return Array.from(salesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }
  async getPackagingAnalytics() {
    const records = await this.packagingRepository.find({
      relations: {
        product: true,
      },
    });

    const packagingMap = new Map<
      string,
      {
        productName: string;

        totalProduced: number;
      }
    >();

    records.forEach((record) => {
      const existing = packagingMap.get(record.product.id);

      if (existing) {
        existing.totalProduced += record.quantityProduced;
      } else {
        packagingMap.set(record.product.id, {
          productName: record.product.name,

          totalProduced: record.quantityProduced,
        });
      }
    });

    return Array.from(packagingMap.values())
      .sort((a, b) => b.totalProduced - a.totalProduced)
      .slice(0, 5);
  }
  async getSalesAnalytics() {
    const operations = await this.salesOperationsRepository.find({
      relations: {
        product: true,
        performedBy: true,
      },
    });

    let websiteRevenue = 0;

    let walkInRevenue = 0;

    let shopDeliveryRevenue = 0;

    let staffAllocationValue = 0;

    for (const operation of operations) {
      if (operation.operationType === SalesOperationType.WALK_IN_SALE) {
        walkInRevenue += Number(operation.totalAmount);
      }

      if (operation.operationType === SalesOperationType.SHOP_DELIVERY) {
        shopDeliveryRevenue += Number(operation.totalAmount);
      }

      if (operation.operationType === SalesOperationType.STAFF_ALLOCATION) {
        staffAllocationValue += Number(operation.totalAmount);
      }
    }

    const websiteOrders = await this.ordersRepository.find();

    for (const order of websiteOrders) {
      websiteRevenue += Number(order.totalAmount);
    }

    return {
      websiteRevenue,

      walkInRevenue,

      shopDeliveryRevenue,

      staffAllocationValue,

      totalRevenue: websiteRevenue + walkInRevenue + shopDeliveryRevenue,
    };
  }
  async getDamageAnalytics() {
    const damages = await this.inventoryRepository.find({
      where: {
        movementType: InventoryMovementType.DAMAGE,
      },

      relations: {
        product: true,
      },
    });

    let totalLoss = 0;

    for (const damage of damages) {
      totalLoss += Number(damage.product.price) * damage.quantity;
    }

    return {
      totalLoss,

      totalDamagedItems: damages.length,
    };
  }
  async getTopProducts() {
    const operations: SalesOperation[] =
      await this.salesOperationsRepository.find();

    const map = new Map<
      string,
      {
        name: string;
        quantity: number;
      }
    >();

    for (const operation of operations) {
      if (!operation.product) {
        continue;
      }

      const existing = map.get(operation.product.id);

      if (existing) {
        existing.quantity += operation.quantity;
      } else {
        map.set(operation.product.id, {
          name: operation.product.name,

          quantity: operation.quantity,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }
  async getInventoryValue() {
    const products = await this.productsRepository.find();

    let totalValue = 0;

    for (const product of products) {
      totalValue += Number(product.price) * product.stockQuantity;
    }

    return {
      totalValue,
    };
  }

  async exportCsv(res: Response): Promise<void> {
    const orders = await this.ordersRepository.find();

    const rows = orders.map((order) =>
      [order.orderNumber, order.customerName, Number(order.totalAmount)].join(
        ',',
      ),
    );

    const csv = ['Order Number,Customer,Amount', ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=tilime-report.csv',
    );

    res.send(csv);
  }
  async exportExcel(res: Response): Promise<void> {
    const orders = await this.ordersRepository.find();

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Reports');

    worksheet.columns = [
      {
        header: 'Order Number',

        key: 'orderNumber',

        width: 25,
      },

      {
        header: 'Customer',

        key: 'customerName',

        width: 30,
      },

      {
        header: 'Amount',

        key: 'totalAmount',

        width: 20,
      },
    ];

    orders.forEach((order) => {
      worksheet.addRow({
        orderNumber: order.orderNumber,

        customerName: order.customerName,

        totalAmount: Number(order.totalAmount),
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=tilime-report.xlsx',
    );

    await workbook.xlsx.write(res);

    res.end();
  }
  async exportOrders(res: Response): Promise<void> {
    const orders = await this.ordersRepository.find();

    const rows = orders.map((order) =>
      [
        order.orderNumber,

        order.customerName,

        order.totalAmount,

        order.orderStatus,

        order.paymentStatus,

        new Date(order.createdAt).toLocaleDateString(),
      ].join(','),
    );

    const csv = [
      'Order Number,Customer,Amount,Order Status,Payment Status,Date',

      ...rows,
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=orders-report.csv',
    );

    res.send(csv);
  }
  async exportInventory(res: Response): Promise<void> {
    const products = await this.productsRepository.find({
      relations: {
        category: true,
      },
    });

    const rows = products.map((product) =>
      [
        product.name,

        product.sku,

        product.stockQuantity,

        product.lowStockLevel,

        product.category.name,

        Number(product.price) * product.stockQuantity,
      ].join(','),
    );

    const csv = [
      'Product,SKU,Stock,Low Stock Level,Category,Inventory Value',

      ...rows,
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=inventory-report.csv',
    );

    res.send(csv);
  }
  async exportSales(res: Response): Promise<void> {
    const operations = await this.salesOperationsRepository.find({
      relations: {
        product: true,
        performedBy: true,
      },
    });

    const rows = operations.map((operation) =>
      [
        operation.product?.name,

        operation.operationType,

        operation.quantity,

        operation.unitPrice,

        operation.totalAmount,

        operation.performedBy ? operation.performedBy.fullName : 'System',

        new Date(operation.createdAt).toLocaleDateString(),
      ].join(','),
    );

    const csv = [
      'Product,Operation Type,Quantity,Unit Price,Total Amount,Performed By,Date',

      ...rows,
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-operations-report.csv',
    );

    res.send(csv);
  }
  async exportPackaging(res: Response): Promise<void> {
    const records = await this.packagingRepository.find({
      relations: {
        product: true,
      },
    });

    const rows = records.map((record) =>
      [
        record.product.name,

        record.quantityProduced,

        new Date(record.packagedAt).toLocaleDateString(),
      ].join(','),
    );

    const csv = ['Product,Quantity Produced,Date', ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=packaging-report.csv',
    );

    res.send(csv);
  }
  async exportDamages(res: Response): Promise<void> {
    const damages = await this.inventoryRepository.find({
      where: {
        movementType: InventoryMovementType.DAMAGE,
      },

      relations: {
        product: true,
      },
    });

    const rows = damages.map((damage) =>
      [
        damage.product.name,

        damage.quantity,

        Number(damage.product.price) * damage.quantity,

        new Date(damage.createdAt).toLocaleDateString(),
      ].join(','),
    );

    const csv = ['Product,Quantity Damaged,Loss Value,Date', ...rows].join(
      '\n',
    );

    res.setHeader('Content-Type', 'text/csv');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=damages-report.csv',
    );

    res.send(csv);
  }
  async exportRevenueSummary(res: Response): Promise<void> {
    const websiteOrders = await this.ordersRepository.find();

    const operations = await this.salesOperationsRepository.find({
      relations: {
        product: true,
        performedBy: true,
      },
    });

    const websiteRows = websiteOrders.map((order) => ({
      type: 'WEBSITE_ORDER',

      reference: order.orderNumber,

      customer: order.customerName,

      amount: Number(order.totalAmount),

      date: new Date(order.createdAt).toLocaleDateString(),
    }));

    const operationRows = operations.map((operation) => ({
      type: operation.operationType,

      reference: operation.product?.name || 'Product',

      customer: operation.recipient || 'N/A',

      amount: Number(operation.totalAmount),

      date: new Date(operation.createdAt).toLocaleDateString(),
    }));

    const rows = [
      ['Type', 'Reference', 'Customer', 'Amount', 'Date'].join(','),

      ...websiteRows.map((row) =>
        [row.type, row.reference, row.customer, row.amount, row.date].join(','),
      ),

      ...operationRows.map((row) =>
        [row.type, row.reference, row.customer, row.amount, row.date].join(','),
      ),
    ];

    const csv = rows.join('\n');

    res.header('Content-Type', 'text/csv');

    res.attachment('revenue-summary.csv');

    res.send(csv);
  }
  async exportAuditLogs(res: Response): Promise<void> {
    const logs = await this.auditRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    const rows = logs.map((log) =>
      [
        log.action,

        log.entityType,

        JSON.stringify(log.metadata),

        new Date(log.createdAt).toLocaleString(),
      ].join(','),
    );

    const csv = ['Action,Entity Type,Metadata,Date', ...rows].join('\n');

    res.header('Content-Type', 'text/csv');

    res.attachment('audit-logs.csv');

    res.send(csv);
  }
}
