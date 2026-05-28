import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PackagingRecord } from './entities/packaging-record.entity';

import { RawHoneyBatch } from '../raw-honey/entities/raw-honey-batch.entity';

import { Product } from '../products/entities/product.entity';

import { User } from '../users/entities/user.entity';

import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

import { CreatePackagingDto } from './dto/create-packaging.dto';

import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PackagingService {
  constructor(
    @InjectRepository(PackagingRecord)
    private readonly packagingRepository: Repository<PackagingRecord>,

    @InjectRepository(RawHoneyBatch)
    private readonly rawHoneyRepository: Repository<RawHoneyBatch>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(InventoryMovement)
    private readonly inventoryRepository: Repository<InventoryMovement>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async packageHoney(dto: CreatePackagingDto): Promise<PackagingRecord> {
    const rawHoneyBatch = await this.rawHoneyRepository.findOne({
      where: {
        id: dto.rawHoneyBatchId,
      },
    });

    if (!rawHoneyBatch) {
      throw new NotFoundException('Raw honey batch not found');
    }

    const product = await this.productsRepository.findOne({
      where: {
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: dto.packagedBy,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (rawHoneyBatch.remainingQuantityKg < dto.honeyUsedKg) {
      throw new BadRequestException('Insufficient raw honey available');
    }

    const previousRawHoney = rawHoneyBatch.remainingQuantityKg;

    const previousStock = product.stockQuantity;

    rawHoneyBatch.remainingQuantityKg -= dto.honeyUsedKg;

    await this.rawHoneyRepository.save(rawHoneyBatch);

    product.stockQuantity += dto.quantityProduced;

    await this.productsRepository.save(product);

    const packagingRecord = this.packagingRepository.create({
      rawHoneyBatch,

      product,

      quantityProduced: dto.quantityProduced,

      honeyUsedKg: dto.honeyUsedKg,

      packagedBy: user,

      notes: dto.notes,
    });

    const savedPackagingRecord =
      await this.packagingRepository.save(packagingRecord);

    const inventoryMovement = this.inventoryRepository.create({
      product,

      movementType: InventoryMovementType.PACKAGING,

      quantity: dto.quantityProduced,

      performedBy: user,

      referenceId: savedPackagingRecord.id,

      notes: 'Packaging operation completed',
    });

    await this.inventoryRepository.save(inventoryMovement);

    await this.auditLogsService.createLog({
      action: 'PACKAGE_PRODUCT',

      entityType: 'PACKAGING',

      entityId: savedPackagingRecord.id,

      performedBy: user.email,

      before: {
        rawHoneyRemaining: previousRawHoney,

        productStock: previousStock,
      },

      after: {
        rawHoneyRemaining: rawHoneyBatch.remainingQuantityKg,

        productStock: product.stockQuantity,

        quantityProduced: dto.quantityProduced,

        honeyUsedKg: dto.honeyUsedKg,
      },

      metadata: {
        product: product.name,
      },
    });

    return savedPackagingRecord;
  }

  async getPackagingRecords(): Promise<PackagingRecord[]> {
    return this.packagingRepository.find({
      order: {
        packagedAt: 'DESC',
      },
    });
  }
}
