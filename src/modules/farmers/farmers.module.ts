import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Farmer } from './entities/farmer.entity';

import { FarmersController } from './farmers.controller';

import { FarmersService } from './farmers.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Farmer]), AuditLogsModule],

  controllers: [FarmersController],

  providers: [FarmersService],

  exports: [FarmersService],
})
export class FarmersModule {}
