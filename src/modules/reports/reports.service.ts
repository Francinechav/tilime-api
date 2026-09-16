import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import type { Response } from 'express';
import ExcelJS from 'exceljs';

import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { PackagingRecord } from '../packaging/entities/packaging-record.entity';
import { SalesOperation } from '../sales-operations/entities/sales-operation.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { RawHoneyBatch } from '../raw-honey/entities/raw-honey-batch.entity';
import { DailyActivity } from '../daily-activities/entities/daily-activity.entity';

import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { SalesOperationType } from '../../common/enums/sales-operation-type.enum';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';

import { RevenueQueryDto } from './dto/revenue-query.dto';

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

    @InjectRepository(RawHoneyBatch)
    private readonly rawHoneyRepository: Repository<RawHoneyBatch>,

    @InjectRepository(DailyActivity)
    private readonly dailyActivitiesRepository: Repository<DailyActivity>,
  ) {}

  // ============================================================
  // HELPERS
  // ============================================================

  private getDateRange(query?: RevenueQueryDto): {
    start?: Date;
    end?: Date;
  } {
    if (!query?.startDate && !query?.endDate) {
      return {};
    }

    const start = query.startDate
      ? new Date(`${query.startDate}T00:00:00.000`)
      : undefined;

    const end = query.endDate
      ? new Date(`${query.endDate}T23:59:59.999`)
      : undefined;

    return { start, end };
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) {
      return '';
    }

    const date =
      value instanceof Date
        ? value
        : new Date(`${String(value).split('T')[0]}T00:00:00`);

    return date.toLocaleDateString();
  }

  private formatDateTime(value?: Date | string | null): string {
    if (!value) {
      return '';
    }

    return new Date(value).toLocaleString();
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue: string;

    if (typeof value === 'string') {
      stringValue = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      stringValue = value.toString();
    } else if (value instanceof Date) {
      stringValue = value.toISOString();
    } else {
      stringValue = JSON.stringify(value);
    }

    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  private toCsv(headers: string[], rows: unknown[][]): string {
    return [
      headers.map((header) => this.escapeCsvValue(header)).join(','),
      ...rows.map((row) =>
        row.map((value) => this.escapeCsvValue(value)).join(','),
      ),
    ].join('\n');
  }

  private sendCsv(
    res: Response,
    filename: string,
    headers: string[],
    rows: unknown[][],
  ): void {
    const csv = this.toCsv(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(csv);
  }

  private async sendExcel(
    res: Response,
    filename: string,
    sheetName: string,
    headers: string[],
    rows: unknown[][],
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.max(header.length + 4, 16),
    }));

    rows.forEach((row) => {
      const rowObject: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        rowObject[header] = row[index];
      });

      worksheet.addRow(rowObject);
    });

    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1,
      },
    ];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  private applyDateFilter<T extends Record<string, unknown>>(
    where: T,
    field: keyof T,
    query?: RevenueQueryDto,
  ): T {
    const { start, end } = this.getDateRange(query);

    if (start && end) {
      where[field] = Between(start, end) as T[keyof T];
    } else if (start) {
      where[field] = Between(
        start,
        new Date('9999-12-31T23:59:59.999'),
      ) as T[keyof T];
    } else if (end) {
      where[field] = Between(
        new Date('1970-01-01T00:00:00.000'),
        end,
      ) as T[keyof T];
    }

    return where;
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  async getDashboardAnalytics() {
    const [successfulOrders, products] = await Promise.all([
      this.ordersRepository.find({
        where: {
          paymentStatus: PaymentStatus.SUCCESS,
        },
      }),
      this.productsRepository.find(),
    ]);

    const offlineSales = await this.salesOperationsRepository.find({
      where: {
        operationType: In([
          SalesOperationType.WALK_IN_SALE,
          SalesOperationType.SHOP_DELIVERY,
        ]),
      },
    });

    const websiteRevenue = successfulOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const offlineRevenue = offlineSales.reduce(
      (sum, operation) => sum + Number(operation.totalAmount),
      0,
    );

    const totalRevenue = websiteRevenue + offlineRevenue;

    const lowStockProducts = products.filter(
      (product) => product.stockQuantity <= product.lowStockLevel,
    ).length;

    const recentOrders = successfulOrders
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: successfulOrders.length,
      totalProducts: products.length,
      lowStockProducts,
      recentOrders,
    };
  }

  // ============================================================
  // MONTHLY REVENUE
  // ============================================================

  async getMonthlyRevenue(query?: RevenueQueryDto) {
    const { start, end } = this.getDateRange(query);

    const orders = await this.ordersRepository.find({
      where: {
        paymentStatus: PaymentStatus.SUCCESS,
      },
    });

    const salesOperations = await this.salesOperationsRepository.find({
      where: {
        operationType: In([
          SalesOperationType.WALK_IN_SALE,
          SalesOperationType.SHOP_DELIVERY,
        ]),
      },
    });

    const monthlyMap = new Map<string, number>();

    orders.forEach((order) => {
      const date = new Date(order.createdAt);

      if (start && date < start) return;
      if (end && date > end) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}`;

      monthlyMap.set(
        key,
        (monthlyMap.get(key) || 0) + Number(order.totalAmount),
      );
    });

    salesOperations.forEach((operation) => {
      const date = operation.operationDate
        ? new Date(`${this.formatDate(operation.operationDate)}T00:00:00`)
        : new Date(operation.createdAt);

      if (start && date < start) return;
      if (end && date > end) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}`;

      monthlyMap.set(
        key,
        (monthlyMap.get(key) || 0) + Number(operation.totalAmount),
      );
    });

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue]) => {
        const [year, month] = key.split('-');

        const date = new Date(Number(year), Number(month) - 1, 1);

        return {
          month: date.toLocaleString('default', {
            month: 'short',
          }),
          year: Number(year),
          revenue,
        };
      });
  }

  // ============================================================
  // TOP PRODUCTS
  // ============================================================

  async getTopSellingProducts(query?: RevenueQueryDto) {
    const { start, end } = this.getDateRange(query);

    const successfulOrders = await this.ordersRepository.find({
      where: {
        paymentStatus: PaymentStatus.SUCCESS,
      },
    });

    const salesMap = new Map<
      string,
      {
        productName: string;
        quantity: number;
        revenue: number;
      }
    >();

    successfulOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);

      if (start && orderDate < start) return;
      if (end && orderDate > end) return;

      order.items.forEach((item) => {
        const existing = salesMap.get(item.product.id);

        if (existing) {
          existing.quantity += Number(item.quantity);
          existing.revenue += Number(item.subtotal);
        } else {
          salesMap.set(item.product.id, {
            productName: item.product.name,
            quantity: Number(item.quantity),
            revenue: Number(item.subtotal),
          });
        }
      });
    });

    const offlineSales = await this.salesOperationsRepository.find({
      where: {
        operationType: In([
          SalesOperationType.WALK_IN_SALE,
          SalesOperationType.SHOP_DELIVERY,
        ]),
      },
    });

    offlineSales.forEach((operation) => {
      const operationDate = operation.operationDate
        ? new Date(`${this.formatDate(operation.operationDate)}T00:00:00`)
        : new Date(operation.createdAt);

      if (start && operationDate < start) return;
      if (end && operationDate > end) return;

      if (!operation.product) return;

      const existing = salesMap.get(operation.product.id);

      if (existing) {
        existing.quantity += Number(operation.quantity);
        existing.revenue += Number(operation.totalAmount);
      } else {
        salesMap.set(operation.product.id, {
          productName: operation.product.name,
          quantity: Number(operation.quantity),
          revenue: Number(operation.totalAmount),
        });
      }
    });

    return Array.from(salesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  // ============================================================
  // PACKAGING ANALYTICS
  // ============================================================

  async getPackagingAnalytics(query?: RevenueQueryDto) {
    const records = await this.getPackagingRecords(query);

    const packagingMap = new Map<
      string,
      {
        productName: string;
        totalProduced: number;
      }
    >();

    records.forEach((record) => {
      if (!record.product) return;

      const existing = packagingMap.get(record.product.id);

      if (existing) {
        existing.totalProduced += Number(record.quantityProduced);
      } else {
        packagingMap.set(record.product.id, {
          productName: record.product.name,
          totalProduced: Number(record.quantityProduced),
        });
      }
    });

    return Array.from(packagingMap.values())
      .sort((a, b) => b.totalProduced - a.totalProduced)
      .slice(0, 5);
  }

  // ============================================================
  // SALES ANALYTICS
  // ============================================================

  async getSalesAnalytics(query?: RevenueQueryDto) {
    const { start, end } = this.getDateRange(query);

    const operations = await this.salesOperationsRepository.find({
      relations: {
        product: true,
        performedBy: true,
      },
    });

    let walkInRevenue = 0;
    let shopDeliveryRevenue = 0;
    let staffAllocationValue = 0;
    let damageValue = 0;

    for (const operation of operations) {
      const date = operation.operationDate
        ? new Date(`${this.formatDate(operation.operationDate)}T00:00:00`)
        : new Date(operation.createdAt);

      if (start && date < start) continue;
      if (end && date > end) continue;

      if (operation.operationType === SalesOperationType.WALK_IN_SALE) {
        walkInRevenue += Number(operation.totalAmount);
      }

      if (operation.operationType === SalesOperationType.SHOP_DELIVERY) {
        shopDeliveryRevenue += Number(operation.totalAmount);
      }

      if (operation.operationType === SalesOperationType.STAFF_ALLOCATION) {
        staffAllocationValue += Number(operation.totalAmount);
      }

      if (operation.operationType === SalesOperationType.DAMAGE) {
        damageValue += Number(operation.totalAmount);
      }
    }

    const successfulOrders = await this.ordersRepository.find({
      where: {
        paymentStatus: PaymentStatus.SUCCESS,
      },
    });

    let websiteRevenue = 0;

    successfulOrders.forEach((order) => {
      const date = new Date(order.createdAt);

      if (start && date < start) return;
      if (end && date > end) return;

      websiteRevenue += Number(order.totalAmount);
    });

    return {
      websiteRevenue,
      walkInRevenue,
      shopDeliveryRevenue,
      staffAllocationValue,
      damageValue,
      totalRevenue: websiteRevenue + walkInRevenue + shopDeliveryRevenue,
    };
  }

  // ============================================================
  // DAMAGE ANALYTICS
  // ============================================================

  async getDamageAnalytics(query?: RevenueQueryDto) {
    const damages = await this.getDamageMovements(query);

    let totalLoss = 0;
    let totalDamagedQuantity = 0;

    damages.forEach((damage) => {
      const quantity = Math.abs(Number(damage.quantity));

      totalDamagedQuantity += quantity;

      totalLoss += Number(damage.product.price) * quantity;
    });

    return {
      totalLoss,
      totalDamagedItems: damages.length,
      totalDamagedQuantity,
    };
  }

  // ============================================================
  // TOP PRODUCTS - LEGACY COMPATIBILITY
  // ============================================================

  async getTopProducts(query?: RevenueQueryDto) {
    return this.getTopSellingProducts(query);
  }

  // ============================================================
  // CURRENT INVENTORY
  // ============================================================

  async getInventoryValue() {
    const products = await this.productsRepository.find();

    let totalValue = 0;

    for (const product of products) {
      totalValue += Number(product.price) * Number(product.stockQuantity);
    }

    return {
      totalValue,
    };
  }

  async getInventoryReport() {
    const products = await this.productsRepository.find({
      relations: {
        category: true,
      },
      order: {
        name: 'ASC',
      },
    });

    return products.map((product) => ({
      id: product.id,
      product: product.name,
      sku: product.sku,
      stock: Number(product.stockQuantity),
      lowStockLevel: Number(product.lowStockLevel),
      category: product.category?.name || '',
      price: Number(product.price),
      inventoryValue: Number(product.price) * Number(product.stockQuantity),
      isLowStock:
        Number(product.stockQuantity) <= Number(product.lowStockLevel),
      isActive: product.isActive,
    }));
  }

  // ============================================================
  // INVENTORY MOVEMENTS
  // ============================================================

  async getInventoryMovementsReport(query?: RevenueQueryDto) {
    const movements = await this.getInventoryMovements(query);

    return movements.map((movement) => ({
      id: movement.id,
      product: movement.product?.name || '',
      sku: movement.product?.sku || '',
      movementType: movement.movementType,
      quantity: Number(movement.quantity),
      referenceId: movement.referenceId || '',
      performedBy: movement.performedBy?.fullName || 'System',
      notes: movement.notes || '',
      date: this.formatDateTime(movement.createdAt),
    }));
  }

  // ============================================================
  // SALES REPORT
  // ============================================================

  async getSalesReport(query?: RevenueQueryDto) {
    const operations = await this.getSalesOperations(query);

    return operations.map((operation) => ({
      id: operation.id,
      product: operation.product?.name || '',
      sku: operation.product?.sku || '',
      operationType: operation.operationType,
      quantity: Number(operation.quantity),
      unitPrice: Number(operation.unitPrice),
      totalAmount: Number(operation.totalAmount),
      recipient: operation.recipient || '',
      collectedBy: operation.collectedBy || '',
      performedBy: operation.performedBy?.fullName || 'System',
      saleDate: operation.operationDate
        ? this.formatDate(operation.operationDate)
        : this.formatDate(operation.createdAt),
      recordedAt: this.formatDateTime(operation.createdAt),
      notes: operation.notes || '',
    }));
  }

  // ============================================================
  // ORDERS REPORT
  // ============================================================

  async getOrdersReport(query?: RevenueQueryDto) {
    const orders = await this.getOrders(query);

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail || '',
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      totalAmount: Number(order.totalAmount),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      deliveryMethod: order.deliveryMethod,
      orderDate: this.formatDate(order.createdAt),
      items: order.items.map((item) => ({
        product: item.product?.name || '',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    }));
  }

  // ============================================================
  // RAW HONEY REPORT
  // ============================================================

  async getRawHoneyReport(query?: RevenueQueryDto) {
    const batches = await this.getRawHoneyBatches(query);

    return batches.map((batch) => ({
      id: batch.id,
      batchNumber: batch.batchNumber,
      sourceType: batch.sourceType,
      farmer: batch.farmer?.fullName || '',
      quantityKg: Number(batch.quantityKg),
      remainingQuantityKg: Number(batch.remainingQuantityKg),
      usedQuantityKg:
        Number(batch.quantityKg) - Number(batch.remainingQuantityKg),
      costPerKg:
        batch.costPerKg !== null && batch.costPerKg !== undefined
          ? Number(batch.costPerKg)
          : null,
      totalCost:
        batch.totalCost !== null && batch.totalCost !== undefined
          ? Number(batch.totalCost)
          : null,
      recordedAt: this.formatDateTime(batch.createdAt),
      notes: batch.notes || '',
    }));
  }

  // ============================================================
  // PACKAGING REPORT
  // ============================================================

  async getPackagingReport(query?: RevenueQueryDto) {
    const records = await this.getPackagingRecords(query);

    return records.map((record) => ({
      id: record.id,
      product: record.product?.name || '',
      packagingType: record.type,
      quantityProduced: Number(record.quantityProduced),
      honeyUsedKg:
        record.honeyUsedKg !== null && record.honeyUsedKg !== undefined
          ? Number(record.honeyUsedKg)
          : null,
      packagedBy: record.packagedBy?.fullName || 'System',
      productionDate: record.packagedAt
        ? this.formatDate(record.packagedAt)
        : '',
      notes: record.notes || '',
    }));
  }

  // ============================================================
  // DAILY ACTIVITIES REPORT
  // ============================================================

  async getDailyActivitiesReport(query?: RevenueQueryDto) {
    const activities = await this.getDailyActivities(query);

    return activities.map((activity) => ({
      id: activity.id,
      activityDate: this.formatDate(activity.activityDate),
      category: activity.category?.name || '',
      location: activity.location,
      activity: activity.activity,
      details: activity.details || '',
      recordedBy: activity.recordedBy?.fullName || 'System',
      recordedAt: this.formatDateTime(activity.createdAt),
    }));
  }

  // ============================================================
  // DAMAGES REPORT
  // ============================================================

  async getDamagesReport(query?: RevenueQueryDto) {
    const damages = await this.getDamageMovements(query);

    return damages.map((damage) => {
      const quantity = Math.abs(Number(damage.quantity));

      return {
        id: damage.id,
        product: damage.product?.name || '',
        sku: damage.product?.sku || '',
        quantityDamaged: quantity,
        lossValue: Number(damage.product?.price || 0) * quantity,
        date: this.formatDateTime(damage.createdAt),
        performedBy: damage.performedBy?.fullName || 'System',
        notes: damage.notes || '',
        referenceId: damage.referenceId || '',
      };
    });
  }

  // ============================================================
  // REVENUE SUMMARY
  // ============================================================

  async getRevenueSummary(query?: RevenueQueryDto) {
    const orders = await this.getOrders(query);

    const operations = await this.getSalesOperations(query);

    const websiteRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const offlineRevenue = operations
      .filter(
        (operation) =>
          operation.operationType === SalesOperationType.WALK_IN_SALE ||
          operation.operationType === SalesOperationType.SHOP_DELIVERY,
      )
      .reduce((sum, operation) => sum + Number(operation.totalAmount), 0);

    const staffAllocationValue = operations
      .filter(
        (operation) =>
          operation.operationType === SalesOperationType.STAFF_ALLOCATION,
      )
      .reduce((sum, operation) => sum + Number(operation.totalAmount), 0);

    const damageValue = operations
      .filter(
        (operation) => operation.operationType === SalesOperationType.DAMAGE,
      )
      .reduce((sum, operation) => sum + Number(operation.totalAmount), 0);

    return {
      websiteRevenue,
      offlineRevenue,
      staffAllocationValue,
      damageValue,
      totalRevenue: websiteRevenue + offlineRevenue,
    };
  }

  // ============================================================
  // DATA RETRIEVAL HELPERS
  // ============================================================

  private async getOrders(query?: RevenueQueryDto): Promise<Order[]> {
    const orders = await this.ordersRepository.find({
      where: {
        paymentStatus: PaymentStatus.SUCCESS,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const { start, end } = this.getDateRange(query);

    return orders.filter((order) => {
      const date = new Date(order.createdAt);

      if (start && date < start) return false;
      if (end && date > end) return false;

      return true;
    });
  }

  private async getSalesOperations(
    query?: RevenueQueryDto,
  ): Promise<SalesOperation[]> {
    const operations = await this.salesOperationsRepository.find({
      relations: {
        product: true,
        performedBy: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const { start, end } = this.getDateRange(query);

    return operations.filter((operation) => {
      const date = operation.operationDate
        ? new Date(`${this.formatDate(operation.operationDate)}T00:00:00`)
        : new Date(operation.createdAt);

      if (start && date < start) return false;
      if (end && date > end) return false;

      return true;
    });
  }

  private async getInventoryMovements(
    query?: RevenueQueryDto,
  ): Promise<InventoryMovement[]> {
    const movements = await this.inventoryRepository.find({
      relations: {
        product: true,
        performedBy: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const { start, end } = this.getDateRange(query);

    return movements.filter((movement) => {
      const date = new Date(movement.createdAt);

      if (start && date < start) return false;
      if (end && date > end) return false;

      return true;
    });
  }

  private async getDamageMovements(
    query?: RevenueQueryDto,
  ): Promise<InventoryMovement[]> {
    const movements = await this.getInventoryMovements(query);

    return movements.filter(
      (movement) => movement.movementType === InventoryMovementType.DAMAGE,
    );
  }

  private async getPackagingRecords(
    query?: RevenueQueryDto,
  ): Promise<PackagingRecord[]> {
    const records = await this.packagingRepository.find({
      relations: {
        product: true,
        packagedBy: true,
      },
      order: {
        packagedAt: 'DESC',
      },
    });

    const { start, end } = this.getDateRange(query);

    return records.filter((record) => {
      const date = record.packagedAt
        ? new Date(`${this.formatDate(record.packagedAt)}T00:00:00`)
        : null;

      if (!date) {
        return !start && !end;
      }

      if (start && date < start) return false;
      if (end && date > end) return false;

      return true;
    });
  }

  private async getRawHoneyBatches(
    query?: RevenueQueryDto,
  ): Promise<RawHoneyBatch[]> {
    const batches = await this.rawHoneyRepository.find({
      relations: {
        farmer: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const { start, end } = this.getDateRange(query);

    return batches.filter((batch) => {
      const date = new Date(batch.createdAt);

      if (start && date < start) return false;
      if (end && date > end) return false;

      return true;
    });
  }

  private async getDailyActivities(
    query?: RevenueQueryDto,
  ): Promise<DailyActivity[]> {
    const activities = await this.dailyActivitiesRepository.find({
      relations: {
        category: true,
        recordedBy: true,
      },
      order: {
        activityDate: 'DESC',
        createdAt: 'DESC',
      },
    });

    const { start, end } = this.getDateRange(query);

    return activities.filter((activity) => {
      const date = new Date(
        `${this.formatDate(activity.activityDate)}T00:00:00`,
      );

      if (start && date < start) return false;
      if (end && date > end) return false;

      return true;
    });
  }

  // ============================================================
  // CSV EXPORTS
  // ============================================================

  async exportCsv(res: Response, query?: RevenueQueryDto): Promise<void> {
    const orders = await this.getOrders(query);

    const rows = orders.map((order) => [
      order.orderNumber,
      order.customerName,
      Number(order.totalAmount),
      order.orderStatus,
      order.paymentStatus,
      this.formatDate(order.createdAt),
    ]);

    this.sendCsv(
      res,
      'tilime-orders-report.csv',
      [
        'Order Number',
        'Customer',
        'Amount',
        'Order Status',
        'Payment Status',
        'Date',
      ],
      rows,
    );
  }

  async exportExcel(res: Response, query?: RevenueQueryDto): Promise<void> {
    const orders = await this.getOrders(query);

    const rows = orders.map((order) => [
      order.orderNumber,
      order.customerName,
      Number(order.totalAmount),
      order.orderStatus,
      order.paymentStatus,
      this.formatDate(order.createdAt),
    ]);

    await this.sendExcel(
      res,
      'tilime-orders-report.xlsx',
      'Orders',
      [
        'Order Number',
        'Customer',
        'Amount',
        'Order Status',
        'Payment Status',
        'Date',
      ],
      rows,
    );
  }

  async exportOrders(res: Response, query?: RevenueQueryDto): Promise<void> {
    const orders = await this.getOrders(query);

    const rows: unknown[][] = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        rows.push([
          order.orderNumber,
          order.customerName,
          item.product?.name || '',
          Number(item.quantity),
          Number(item.unitPrice),
          Number(item.subtotal),
          order.paymentStatus,
          order.orderStatus,
          order.deliveryMethod,
          this.formatDate(order.createdAt),
        ]);
      });
    });

    this.sendCsv(
      res,
      'orders-report.csv',
      [
        'Order Number',
        'Customer',
        'Product',
        'Quantity',
        'Unit Price',
        'Subtotal',
        'Payment Status',
        'Order Status',
        'Delivery Method',
        'Order Date',
      ],
      rows,
    );
  }

  async exportInventory(res: Response): Promise<void> {
    const products = await this.getInventoryReport();

    const rows = products.map((product) => [
      product.product,
      product.sku,
      product.stock,
      product.lowStockLevel,
      product.category,
      product.price,
      product.inventoryValue,
      product.isLowStock ? 'Yes' : 'No',
      product.isActive ? 'Active' : 'Inactive',
    ]);

    this.sendCsv(
      res,
      'inventory-report.csv',
      [
        'Product',
        'SKU',
        'Stock',
        'Low Stock Level',
        'Category',
        'Price',
        'Inventory Value',
        'Low Stock',
        'Status',
      ],
      rows,
    );
  }

  async exportInventoryMovements(
    res: Response,
    query?: RevenueQueryDto,
  ): Promise<void> {
    const movements = await this.getInventoryMovementsReport(query);

    const rows = movements.map((movement) => [
      movement.product,
      movement.sku,
      movement.movementType,
      movement.quantity,
      movement.referenceId,
      movement.performedBy,
      movement.date,
      movement.notes,
    ]);

    this.sendCsv(
      res,
      'inventory-movements-report.csv',
      [
        'Product',
        'SKU',
        'Movement Type',
        'Quantity',
        'Reference',
        'Performed By',
        'Date',
        'Notes',
      ],
      rows,
    );
  }

  async exportSales(res: Response, query?: RevenueQueryDto): Promise<void> {
    const sales = await this.getSalesReport(query);

    const rows = sales.map((sale) => [
      sale.product,
      sale.sku,
      sale.operationType,
      sale.quantity,
      sale.unitPrice,
      sale.totalAmount,
      sale.recipient,
      sale.collectedBy,
      sale.performedBy,
      sale.saleDate,
      sale.recordedAt,
      sale.notes,
    ]);

    this.sendCsv(
      res,
      'sales-operations-report.csv',
      [
        'Product',
        'SKU',
        'Operation Type',
        'Quantity',
        'Unit Price',
        'Total Amount',
        'Recipient',
        'Collected By',
        'Performed By',
        'Sale Date',
        'Recorded At',
        'Notes',
      ],
      rows,
    );
  }

  async exportPackaging(res: Response, query?: RevenueQueryDto): Promise<void> {
    const packaging = await this.getPackagingReport(query);

    const rows = packaging.map((record) => [
      record.product,
      record.packagingType,
      record.quantityProduced,
      record.honeyUsedKg,
      record.packagedBy,
      record.productionDate,
      record.notes,
    ]);

    this.sendCsv(
      res,
      'packaging-report.csv',
      [
        'Product',
        'Packaging Type',
        'Quantity Produced',
        'Honey Used (kg)',
        'Packaged By',
        'Production Date',
        'Notes',
      ],
      rows,
    );
  }

  async exportRawHoney(res: Response, query?: RevenueQueryDto): Promise<void> {
    const batches = await this.getRawHoneyReport(query);

    const rows = batches.map((batch) => [
      batch.batchNumber,
      batch.sourceType,
      batch.farmer,
      batch.quantityKg,
      batch.remainingQuantityKg,
      batch.usedQuantityKg,
      batch.costPerKg,
      batch.totalCost,
      batch.recordedAt,
      batch.notes,
    ]);

    this.sendCsv(
      res,
      'raw-honey-report.csv',
      [
        'Batch Number',
        'Source',
        'Farmer',
        'Quantity (kg)',
        'Remaining (kg)',
        'Used (kg)',
        'Cost Per Kg',
        'Total Cost',
        'Recorded At',
        'Notes',
      ],
      rows,
    );
  }

  async exportDailyActivities(
    res: Response,
    query?: RevenueQueryDto,
  ): Promise<void> {
    const activities = await this.getDailyActivitiesReport(query);

    const rows = activities.map((activity) => [
      activity.activityDate,
      activity.category,
      activity.location,
      activity.activity,
      activity.details,
      activity.recordedBy,
      activity.recordedAt,
    ]);

    this.sendCsv(
      res,
      'daily-activities-report.csv',
      [
        'Activity Date',
        'Category',
        'Location',
        'Activity',
        'Details',
        'Recorded By',
        'Recorded At',
      ],
      rows,
    );
  }

  async exportDamages(res: Response, query?: RevenueQueryDto): Promise<void> {
    const damages = await this.getDamagesReport(query);

    const rows = damages.map((damage) => [
      damage.product,
      damage.sku,
      damage.quantityDamaged,
      damage.lossValue,
      damage.date,
      damage.performedBy,
      damage.referenceId,
      damage.notes,
    ]);

    this.sendCsv(
      res,
      'damages-report.csv',
      [
        'Product',
        'SKU',
        'Quantity Damaged',
        'Loss Value',
        'Date',
        'Performed By',
        'Reference',
        'Notes',
      ],
      rows,
    );
  }

  async exportRevenueSummary(
    res: Response,
    query?: RevenueQueryDto,
  ): Promise<void> {
    const orders = await this.getOrders(query);
    const operations = await this.getSalesOperations(query);

    const rows: unknown[][] = [
      ['WEBSITE_ORDER', 'Confirmed Website Order', '', '', ''],
    ];

    rows.length = 0;

    orders.forEach((order) => {
      rows.push([
        'WEBSITE_ORDER',
        order.orderNumber,
        order.customerName,
        Number(order.totalAmount),
        this.formatDate(order.createdAt),
      ]);
    });

    operations
      .filter(
        (operation) =>
          operation.operationType === SalesOperationType.WALK_IN_SALE ||
          operation.operationType === SalesOperationType.SHOP_DELIVERY,
      )
      .forEach((operation) => {
        rows.push([
          operation.operationType,
          operation.product?.name || 'Product',
          operation.recipient || 'N/A',
          Number(operation.totalAmount),
          operation.operationDate
            ? this.formatDate(operation.operationDate)
            : this.formatDate(operation.createdAt),
        ]);
      });

    this.sendCsv(
      res,
      'revenue-summary.csv',
      ['Type', 'Reference', 'Customer / Recipient', 'Amount', 'Date'],
      rows,
    );
  }

  async exportAuditLogs(res: Response): Promise<void> {
    const logs = await this.auditRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    const rows = logs.map((log) => [
      log.action,
      log.entityType,
      log.entityId || '',
      log.performedBy || '',
      log.metadata ? JSON.stringify(log.metadata) : '',
      log.before ? JSON.stringify(log.before) : '',
      log.after ? JSON.stringify(log.after) : '',
      this.formatDateTime(log.createdAt),
    ]);

    this.sendCsv(
      res,
      'audit-logs.csv',
      [
        'Action',
        'Entity Type',
        'Entity ID',
        'Performed By',
        'Metadata',
        'Before',
        'After',
        'Date',
      ],
      rows,
    );
  }
}
