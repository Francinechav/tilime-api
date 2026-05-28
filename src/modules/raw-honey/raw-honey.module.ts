import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { RawHoneyController } from './raw-honey.controller';
import { RawHoneyService } from './raw-honey.service';

import { RawHoneyBatch } from './entities/raw-honey-batch.entity';

import { Farmer } from '../farmers/entities/farmer.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([RawHoneyBatch, Farmer]), AuditLogsModule],

  controllers: [RawHoneyController],

  providers: [RawHoneyService],

  exports: [RawHoneyService],
})
export class RawHoneyModule {}
