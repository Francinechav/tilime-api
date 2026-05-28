import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { RawHoneyBatch } from './entities/raw-honey-batch.entity';

import { Farmer } from '../farmers/entities/farmer.entity';

import { CreateRawHoneyBatchDto } from './dto/create-raw-honey-batch.dto';

import { RawHoneySourceType } from '../../common/enums/raw-honey-source.enum';
import { UpdateRawHoneyBatchDto } from './dto/update-raw-honey-batch.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class RawHoneyService {
  constructor(
    @InjectRepository(RawHoneyBatch)
    private readonly rawHoneyRepository: Repository<RawHoneyBatch>,

    @InjectRepository(Farmer)
    private readonly farmersRepository: Repository<Farmer>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createBatch(dto: CreateRawHoneyBatchDto): Promise<RawHoneyBatch> {
    const existingBatch = await this.rawHoneyRepository.findOne({
      where: {
        batchNumber: dto.batchNumber,
      },
    });

    if (existingBatch) {
      throw new ConflictException('Batch number already exists');
    }

    let farmer: Farmer | null = null;

    if (dto.sourceType === RawHoneySourceType.FARMER) {
      if (!dto.farmerId) {
        throw new BadRequestException(
          'Farmer is required for FARMER source type',
        );
      }

      farmer = await this.farmersRepository.findOne({
        where: {
          id: dto.farmerId,
        },
      });

      if (!farmer) {
        throw new NotFoundException('Farmer not found');
      }
    }

    const batch = this.rawHoneyRepository.create({
      batchNumber: dto.batchNumber,
      sourceType: dto.sourceType,
      farmer: farmer || undefined,
      quantityKg: dto.quantityKg,
      remainingQuantityKg: dto.quantityKg,
      costPerKg: dto.costPerKg,
      totalCost: dto.totalCost,
      notes: dto.notes,
    });

    const savedBatch: RawHoneyBatch = await this.rawHoneyRepository.save(batch);

    await this.auditLogsService.createLog({
      action: 'CREATE_RAW_HONEY_BATCH',

      entityType: 'RAW_HONEY',

      entityId: savedBatch.id,

      metadata: {
        batchNumber: savedBatch.batchNumber,

        sourceType: savedBatch.sourceType,

        quantityKg: savedBatch.quantityKg,
      },
    });

    return savedBatch;
  }

  async findAllBatches(): Promise<RawHoneyBatch[]> {
    return this.rawHoneyRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }
  async updateRawHoneyBatch(
    id: string,
    dto: UpdateRawHoneyBatchDto,
  ): Promise<RawHoneyBatch> {
    const batch = await this.rawHoneyRepository.findOne({
      where: { id },

      relations: {
        farmer: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Raw honey batch not found');
    }

    if (dto.quantity) {
      const usedQuantity = batch.quantityKg - batch.remainingQuantityKg;

      batch.quantityKg = dto.quantity;

      batch.remainingQuantityKg = dto.quantity - usedQuantity;
    }

    Object.assign(batch, dto);

    const updatedBatch: RawHoneyBatch =
      await this.rawHoneyRepository.save(batch);

    await this.auditLogsService.createLog({
      action: 'UPDATE_RAW_HONEY_BATCH',

      entityType: 'RAW_HONEY',

      entityId: updatedBatch.id,

      metadata: {
        batchNumber: updatedBatch.batchNumber,

        updatedFields: dto,
      },
    });

    return updatedBatch;
  }
  async deleteRawHoneyBatch(id: string) {
    const batch = await this.rawHoneyRepository.findOne({
      where: { id },
    });

    if (!batch) {
      throw new NotFoundException('Raw honey batch not found');
    }

    await this.auditLogsService.createLog({
      action: 'DELETE_RAW_HONEY_BATCH',

      entityType: 'RAW_HONEY',

      entityId: batch.id,

      metadata: {
        batchNumber: batch.batchNumber,
      },
    });

    await this.rawHoneyRepository.remove(batch);

    return {
      message: 'Raw honey batch deleted successfully',
    };
  }
}
