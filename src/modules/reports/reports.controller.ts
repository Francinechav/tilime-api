import { Controller, Get, Res } from '@nestjs/common';

import { ReportsService } from './reports.service';
import express from 'express';
import type { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboardAnalytics() {
    return this.reportsService.getDashboardAnalytics();
  }
  @Get('monthly-revenue')
  getMonthlyRevenue() {
    return this.reportsService.getMonthlyRevenue();
  }
  @Get('top-products')
  getTopSellingProducts() {
    return this.reportsService.getTopSellingProducts();
  }
  @Get('packaging-analytics')
  getPackagingAnalytics() {
    return this.reportsService.getPackagingAnalytics();
  }
  @Get('sales-analytics')
  getSalesAnalytics() {
    return this.reportsService.getSalesAnalytics();
  }

  @Get('damage-analytics')
  getDamageAnalytics() {
    return this.reportsService.getDamageAnalytics();
  }

  @Get('top-products')
  getTopProducts() {
    return this.reportsService.getTopProducts();
  }

  @Get('inventory-value')
  getInventoryValue() {
    return this.reportsService.getInventoryValue();
  }
  @Get('export-csv')
  async exportCsv(
    @Res()
    res: express.Response,
  ): Promise<void> {
    await this.reportsService.exportCsv(res);
  }

  @Get('export-excel')
  async exportExcel(
    @Res()
    res: express.Response,
  ): Promise<void> {
    await this.reportsService.exportExcel(res);
  }
  @Get('export-orders')
  async exportOrders(
    @Res()
    res: Response,
  ): Promise<void> {
    await this.reportsService.exportOrders(res);
  }

  @Get('export-inventory')
  async exportInventory(
    @Res()
    res: Response,
  ): Promise<void> {
    await this.reportsService.exportInventory(res);
  }

  @Get('export-sales')
  async exportSales(
    @Res()
    res: Response,
  ): Promise<void> {
    await this.reportsService.exportSales(res);
  }

  @Get('export-packaging')
  async exportPackaging(
    @Res()
    res: Response,
  ): Promise<void> {
    await this.reportsService.exportPackaging(res);
  }

  @Get('export-damages')
  async exportDamages(
    @Res()
    res: Response,
  ): Promise<void> {
    await this.reportsService.exportDamages(res);
  }
  @Get('export-revenue-summary')
  async exportRevenueSummary(
    @Res()
    res: Response,
  ): Promise<void> {
    await this.reportsService.exportRevenueSummary(res);
  }
  @Get('export-audit-logs')
  async exportAuditLogs(
    @Res()
    res: Response,
  ): Promise<void> {
    await this.reportsService.exportAuditLogs(res);
  }
}
