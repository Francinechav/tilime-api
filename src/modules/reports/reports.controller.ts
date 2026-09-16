import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { ReportsService } from './reports.service';
import { RevenueQueryDto } from './dto/revenue-query.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboardAnalytics() {
    return this.reportsService.getDashboardAnalytics();
  }

  @Get('monthly-revenue')
  getMonthlyRevenue(@Query() query: RevenueQueryDto) {
    return this.reportsService.getMonthlyRevenue(query);
  }

  @Get('top-products')
  getTopSellingProducts(@Query() query: RevenueQueryDto) {
    return this.reportsService.getTopSellingProducts(query);
  }

  @Get('packaging-analytics')
  getPackagingAnalytics(@Query() query: RevenueQueryDto) {
    return this.reportsService.getPackagingAnalytics(query);
  }

  @Get('sales-analytics')
  getSalesAnalytics(@Query() query: RevenueQueryDto) {
    return this.reportsService.getSalesAnalytics(query);
  }

  @Get('damage-analytics')
  getDamageAnalytics(@Query() query: RevenueQueryDto) {
    return this.reportsService.getDamageAnalytics(query);
  }

  @Get('inventory-value')
  getInventoryValue() {
    return this.reportsService.getInventoryValue();
  }

  @Get('sales')
  getSalesReport(@Query() query: RevenueQueryDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('orders')
  getOrdersReport(@Query() query: RevenueQueryDto) {
    return this.reportsService.getOrdersReport(query);
  }

  @Get('inventory')
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('inventory-movements')
  getInventoryMovementsReport(@Query() query: RevenueQueryDto) {
    return this.reportsService.getInventoryMovementsReport(query);
  }

  @Get('raw-honey')
  getRawHoneyReport(@Query() query: RevenueQueryDto) {
    return this.reportsService.getRawHoneyReport(query);
  }

  @Get('packaging')
  getPackagingReport(@Query() query: RevenueQueryDto) {
    return this.reportsService.getPackagingReport(query);
  }

  @Get('daily-activities')
  getDailyActivitiesReport(@Query() query: RevenueQueryDto) {
    return this.reportsService.getDailyActivitiesReport(query);
  }

  @Get('damages')
  getDamagesReport(@Query() query: RevenueQueryDto) {
    return this.reportsService.getDamagesReport(query);
  }

  @Get('revenue-summary')
  getRevenueSummary(@Query() query: RevenueQueryDto) {
    return this.reportsService.getRevenueSummary(query);
  }

  @Get('export-csv')
  async exportCsv(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportCsv(res, query);
  }

  @Get('export-excel')
  async exportExcel(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportExcel(res, query);
  }

  @Get('export-orders')
  async exportOrders(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportOrders(res, query);
  }

  @Get('export-inventory')
  async exportInventory(@Res() res: Response): Promise<void> {
    await this.reportsService.exportInventory(res);
  }

  @Get('export-inventory-movements')
  async exportInventoryMovements(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportInventoryMovements(res, query);
  }

  @Get('export-sales')
  async exportSales(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportSales(res, query);
  }

  @Get('export-packaging')
  async exportPackaging(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportPackaging(res, query);
  }

  @Get('export-raw-honey')
  async exportRawHoney(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportRawHoney(res, query);
  }

  @Get('export-daily-activities')
  async exportDailyActivities(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportDailyActivities(res, query);
  }

  @Get('export-damages')
  async exportDamages(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportDamages(res, query);
  }

  @Get('export-revenue-summary')
  async exportRevenueSummary(
    @Query() query: RevenueQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.reportsService.exportRevenueSummary(res, query);
  }

  @Get('export-audit-logs')
  async exportAuditLogs(@Res() res: Response): Promise<void> {
    await this.reportsService.exportAuditLogs(res);
  }
}
