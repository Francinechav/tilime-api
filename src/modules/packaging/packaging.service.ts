import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { PackagingType } from '../../common/enums/packaging-type.enum';

import { Repository, MoreThan } from 'typeorm';
import { UpdatePackagingDto } from './dto/update-packaging.dto';

import { PackagingRecord } from './entities/packaging-record.entity';

import { RawHoneyBatch } from '../raw-honey/entities/raw-honey-batch.entity';

import { Product } from '../products/entities/product.entity';

import { User } from '../users/entities/user.entity';

import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

import { CreatePackagingDto } from './dto/create-packaging.dto';

import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PackagingConsumption } from './entities/packaging-consumption.entity';

@Injectable()
export class PackagingService {
  constructor(
    @InjectRepository(PackagingRecord)
    private readonly packagingRepository: Repository<PackagingRecord>,

    @InjectRepository(RawHoneyBatch)
    private readonly rawHoneyRepository: Repository<RawHoneyBatch>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(PackagingConsumption)
    private readonly consumptionRepository: Repository<PackagingConsumption>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(InventoryMovement)
    private readonly inventoryRepository: Repository<InventoryMovement>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createPackaging(dto: CreatePackagingDto): Promise<PackagingRecord> {
    if (dto.type === PackagingType.HONEY) {
      return this.packageHoney(dto);
    }

    return this.packageProduct(dto);
  }
  private async packageHoney(
    dto: CreatePackagingDto,
  ): Promise<PackagingRecord> {
    const honeyUsedKg = dto.honeyUsedKg;

    if (!honeyUsedKg) {
      throw new BadRequestException('Honey used is required.');
    }

    const batches = await this.rawHoneyRepository.find({
      where: {
        remainingQuantityKg: MoreThan(0),
      },
      order: {
        createdAt: 'ASC',
      },
    });
    const totalAvailable = batches.reduce(
      (sum, batch) => sum + Number(batch.remainingQuantityKg),
      0,
    );

    if (totalAvailable < honeyUsedKg) {
      throw new BadRequestException('Insufficient raw honey available.');
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

    const previousRawHoney = totalAvailable;

    const previousStock = product.stockQuantity;

    product.stockQuantity += dto.quantityProduced;

    await this.productsRepository.save(product);

    const packagingRecord = this.packagingRepository.create({
      type: PackagingType.HONEY,

      product,

      quantityProduced: dto.quantityProduced,

      honeyUsedKg,

      packagedBy: user,

      notes: dto.notes,
    });
    const savedPackagingRecord =
      await this.packagingRepository.save(packagingRecord);
    await this.consumeHoney(savedPackagingRecord, honeyUsedKg);

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
        rawHoneyRemaining: totalAvailable - honeyUsedKg,

        productStock: product.stockQuantity,

        quantityProduced: dto.quantityProduced,

        honeyUsedKg,
      },

      metadata: {
        product: product.name,
      },
    });

    return savedPackagingRecord;
  }
  private async packageProduct(
    dto: CreatePackagingDto,
  ): Promise<PackagingRecord> {
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

    const previousStock = product.stockQuantity;

    product.stockQuantity += dto.quantityProduced;

    await this.productsRepository.save(product);

    const packagingRecord = this.packagingRepository.create({
      type: PackagingType.PRODUCT,

      product,

      quantityProduced: dto.quantityProduced,

      packagedBy: user,

      notes: dto.notes,
    });

    const savedPackaging = await this.packagingRepository.save(packagingRecord);

    const movement = this.inventoryRepository.create({
      product,

      movementType: InventoryMovementType.PACKAGING,

      quantity: dto.quantityProduced,

      performedBy: user,

      referenceId: savedPackaging.id,

      notes: 'Product packaging completed',
    });

    await this.inventoryRepository.save(movement);

    await this.auditLogsService.createLog({
      action: 'PACKAGE_PRODUCT',

      entityType: 'PACKAGING',

      entityId: savedPackaging.id,

      performedBy: user.email,

      before: {
        productStock: previousStock,
      },

      after: {
        productStock: product.stockQuantity,

        quantityProduced: dto.quantityProduced,
      },

      metadata: {
        type: 'PRODUCT',

        product: product.name,
      },
    });

    return savedPackaging;
  }

  private async consumeHoney(packaging: PackagingRecord, honeyUsedKg: number) {
    const batches = await this.rawHoneyRepository.find({
      where: {
        remainingQuantityKg: MoreThan(0),
      },
      order: {
        createdAt: 'ASC',
      },
    });

    let remainingToDeduct = honeyUsedKg;

    for (const batch of batches) {
      if (remainingToDeduct <= 0) {
        break;
      }

      const available = Number(batch.remainingQuantityKg);

      let deducted = 0;

      if (available >= remainingToDeduct) {
        deducted = remainingToDeduct;

        batch.remainingQuantityKg = available - remainingToDeduct;

        remainingToDeduct = 0;
      } else {
        deducted = available;

        batch.remainingQuantityKg = 0;

        remainingToDeduct -= available;
      }

      await this.rawHoneyRepository.save(batch);

      await this.consumptionRepository.save(
        this.consumptionRepository.create({
          packaging,

          batch,

          quantityKg: deducted,
        }),
      );
    }
  }
  private async restoreHoney(packaging: PackagingRecord) {
    const consumptions = await this.consumptionRepository.find({
      where: {
        packaging: {
          id: packaging.id,
        },
      },
      relations: {
        batch: true,
      },
    });

    for (const consumption of consumptions) {
      consumption.batch.remainingQuantityKg =
        Number(consumption.batch.remainingQuantityKg) +
        Number(consumption.quantityKg);

      await this.rawHoneyRepository.save(consumption.batch);
    }

    await this.consumptionRepository.delete({
      packaging: {
        id: packaging.id,
      },
    });
  }
  async getPackagingRecords(): Promise<PackagingRecord[]> {
    return this.packagingRepository.find({
      order: {
        packagedAt: 'DESC',
      },
    });
  }
  async updatePackaging(
    id: string,
    dto: UpdatePackagingDto,
  ): Promise<PackagingRecord> {
    const packaging = await this.packagingRepository.findOne({
      where: {
        id,
      },
      relations: {
        product: true,
      },
    });

    if (!packaging) {
      throw new NotFoundException('Packaging record not found');
    }
    const before = {
      product: packaging.product.name,
      quantityProduced: packaging.quantityProduced,
      honeyUsedKg: packaging.honeyUsedKg,
      type: packaging.type,
    };

    const product = await this.productsRepository.findOne({
      where: {
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Restore previous product stock
    packaging.product.stockQuantity -= packaging.quantityProduced;

    await this.productsRepository.save(packaging.product);

    // Restore previous honey (only for honey packaging)
    if (packaging.type === PackagingType.HONEY) {
      await this.restoreHoney(packaging);
    }

    // Apply new product stock
    product.stockQuantity += dto.quantityProduced;

    await this.productsRepository.save(product);

    // Consume honey again using FIFO
    if (dto.type === PackagingType.HONEY && dto.honeyUsedKg) {
      await this.consumeHoney(packaging, dto.honeyUsedKg);
    }

    // Update packaging record
    packaging.type = dto.type;
    packaging.product = product;
    packaging.quantityProduced = dto.quantityProduced;
    packaging.honeyUsedKg =
      dto.type === PackagingType.HONEY ? dto.honeyUsedKg : undefined;
    const movement = await this.inventoryRepository.findOne({
      where: {
        referenceId: packaging.id,
        movementType: InventoryMovementType.PACKAGING,
      },
    });

    if (movement) {
      movement.product = product;

      movement.quantity = dto.quantityProduced;

      movement.notes =
        dto.type === PackagingType.HONEY
          ? 'Packaging operation updated'
          : 'Product packaging updated';

      await this.inventoryRepository.save(movement);
    }
    await this.auditLogsService.createLog({
      action: 'UPDATE_PACKAGING',

      entityType: 'PACKAGING',

      entityId: packaging.id,

      performedBy: packaging.packagedBy?.email ?? 'System',
      before,

      after: {
        product: product.name,

        quantityProduced: dto.quantityProduced,

        honeyUsedKg: dto.honeyUsedKg,

        type: dto.type,
      },

      metadata: {
        packagingId: packaging.id,
      },
    });
    const updatedPackaging = await this.packagingRepository.save(packaging);

    return updatedPackaging;
  }
}
