import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { PackagingType } from '../../common/enums/packaging-type.enum';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';

import { CreatePackagingDto } from './dto/create-packaging.dto';
import { UpdatePackagingDto } from './dto/update-packaging.dto';

import { PackagingRecord } from './entities/packaging-record.entity';
import { PackagingConsumption } from './entities/packaging-consumption.entity';

import { RawHoneyBatch } from '../raw-honey/entities/raw-honey-batch.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PackagingService {
  constructor(
    @InjectRepository(PackagingRecord)
    private readonly packagingRepository: Repository<PackagingRecord>,

    @InjectRepository(RawHoneyBatch)
    private readonly rawHoneyRepository: Repository<RawHoneyBatch>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(PackagingConsumption)
    private readonly consumptionRepository: Repository<PackagingConsumption>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementRepository: Repository<InventoryMovement>,

    private readonly auditLogsService: AuditLogsService,

    private readonly dataSource: DataSource,
  ) {}

  // ============================================================
  // CREATE PACKAGING
  // ============================================================

  async createPackaging(dto: CreatePackagingDto): Promise<PackagingRecord> {
    const transactionResult = await this.dataSource.transaction(
      async (manager) => {
        if (dto.type === PackagingType.HONEY) {
          return this.packageHoney(manager, dto);
        }

        return this.packageProduct(manager, dto);
      },
    );

    await this.auditLogsService.createLog({
      action: 'CREATE_PACKAGING',
      entityType: 'PACKAGING',
      entityId: transactionResult.record.id,
      before: transactionResult.auditBefore,
      after: transactionResult.auditAfter,
      metadata: {
        packagingId: transactionResult.record.id,
      },
    });

    return transactionResult.record;
  }

  // ============================================================
  // HONEY PACKAGING
  // ============================================================

  private async packageHoney(manager: EntityManager, dto: CreatePackagingDto) {
    if (dto.honeyUsedKg === undefined || dto.honeyUsedKg <= 0) {
      throw new BadRequestException(
        'honeyUsedKg is required when packaging honey',
      );
    }

    const product = await this.lockProduct(manager, dto.productId);

    const user = await manager.findOne(User, {
      where: { id: dto.packagedBy },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const honeyBatches = await this.getLockedHoneyBatches(manager);

    const totalAvailable = honeyBatches.reduce(
      (total, batch) => total + Number(batch.remainingQuantityKg),
      0,
    );

    if (totalAvailable < dto.honeyUsedKg) {
      throw new BadRequestException(
        `Not enough raw honey available. Available: ${totalAvailable}kg`,
      );
    }

    const previousStock = Number(product.stockQuantity);
    const honeyUsed = dto.honeyUsedKg;

    // Increase finished product stock.
    product.stockQuantity = previousStock + dto.quantityProduced;

    await manager.save(Product, product);

    // Create packaging record.
    const packaging = manager.create(PackagingRecord, {
      type: PackagingType.HONEY,
      product,
      quantityProduced: dto.quantityProduced,
      honeyUsedKg: honeyUsed,
      packagedBy: user,
      packagedAt: new Date(dto.packagedAt),
      notes: dto.notes,
    });

    const savedPackaging = await manager.save(PackagingRecord, packaging);

    // Consume raw honey FIFO.
    await this.consumeHoney(manager, savedPackaging, honeyUsed);

    // Inventory movement.
    const movement = manager.create(InventoryMovement, {
      product,
      movementType: InventoryMovementType.PACKAGING,
      quantity: dto.quantityProduced,
      referenceId: savedPackaging.id,
      performedBy: user,
      notes: dto.notes,
    });

    await manager.save(InventoryMovement, movement);

    return {
      record: savedPackaging,
      auditBefore: {
        productStock: previousStock,
        honeyUsedKg: 0,
      },
      auditAfter: {
        productStock: product.stockQuantity,
        honeyUsedKg: honeyUsed,
        quantityProduced: dto.quantityProduced,
        packagedAt: savedPackaging.packagedAt,
      },
    };
  }

  // ============================================================
  // PRODUCT PACKAGING
  // ============================================================

  private async packageProduct(
    manager: EntityManager,
    dto: CreatePackagingDto,
  ) {
    const product = await this.lockProduct(manager, dto.productId);

    const user = await manager.findOne(User, {
      where: { id: dto.packagedBy },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousStock = Number(product.stockQuantity);

    product.stockQuantity = previousStock + dto.quantityProduced;

    await manager.save(Product, product);

    const packaging = manager.create(PackagingRecord, {
      type: PackagingType.PRODUCT,
      product,
      quantityProduced: dto.quantityProduced,
      packagedBy: user,
      packagedAt: new Date(dto.packagedAt),
      notes: dto.notes,
    });

    const savedPackaging = await manager.save(PackagingRecord, packaging);

    const movement = manager.create(InventoryMovement, {
      product,
      movementType: InventoryMovementType.PACKAGING,
      quantity: dto.quantityProduced,
      referenceId: savedPackaging.id,
      performedBy: user,
      notes: dto.notes,
    });

    await manager.save(InventoryMovement, movement);

    return {
      record: savedPackaging,
      auditBefore: {
        productStock: previousStock,
      },
      auditAfter: {
        productStock: product.stockQuantity,
        quantityProduced: dto.quantityProduced,
        packagedAt: savedPackaging.packagedAt,
      },
    };
  }

  // ============================================================
  // GET LOCKED RAW HONEY BATCHES
  // ============================================================

  private async getLockedHoneyBatches(
    manager: EntityManager,
  ): Promise<RawHoneyBatch[]> {
    return manager
      .getRepository(RawHoneyBatch)
      .createQueryBuilder('batch')
      .setLock('pessimistic_write')
      .where('batch.remainingQuantityKg > :zero', {
        zero: 0,
      })
      .orderBy('batch.createdAt', 'ASC')
      .getMany();
  }

  // ============================================================
  // LOCK PRODUCT
  // ============================================================

  private async lockProduct(
    manager: EntityManager,
    productId: string,
  ): Promise<Product> {
    const product = await manager
      .getRepository(Product)
      .createQueryBuilder('product')
      .setLock('pessimistic_write')
      .where('product.id = :id', {
        id: productId,
      })
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // ============================================================
  // CONSUME RAW HONEY FIFO
  // ============================================================

  private async consumeHoney(
    manager: EntityManager,
    packaging: PackagingRecord,
    quantityKg: number,
  ) {
    let remainingToConsume = quantityKg;

    const batches = await this.getLockedHoneyBatches(manager);

    for (const batch of batches) {
      if (remainingToConsume <= 0) {
        break;
      }

      const available = Number(batch.remainingQuantityKg);

      if (available <= 0) {
        continue;
      }

      const consumed = Math.min(available, remainingToConsume);

      batch.remainingQuantityKg = available - consumed;

      await manager.save(RawHoneyBatch, batch);

      const consumption = manager.create(PackagingConsumption, {
        packaging,
        batch,
        quantityKg: consumed,
      });

      await manager.save(PackagingConsumption, consumption);

      remainingToConsume -= consumed;
    }

    if (remainingToConsume > 0) {
      throw new BadRequestException('Not enough raw honey available');
    }
  }

  // ============================================================
  // RESTORE RAW HONEY
  // ============================================================

  private async restoreHoney(
    manager: EntityManager,
    packaging: PackagingRecord,
  ) {
    const consumptions = await manager.find(PackagingConsumption, {
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
      const batch = await manager
        .getRepository(RawHoneyBatch)
        .createQueryBuilder('batch')
        .setLock('pessimistic_write')
        .where('batch.id = :id', {
          id: consumption.batch.id,
        })
        .getOne();

      if (!batch) {
        throw new NotFoundException(
          `Raw honey batch ${consumption.batch.id} not found`,
        );
      }

      batch.remainingQuantityKg =
        Number(batch.remainingQuantityKg) + Number(consumption.quantityKg);

      await manager.save(RawHoneyBatch, batch);
    }

    await manager.delete(PackagingConsumption, {
      packaging: {
        id: packaging.id,
      },
    });
  }

  // ============================================================
  // GET ALL PACKAGING RECORDS
  // ============================================================

  async getPackagingRecords(): Promise<PackagingRecord[]> {
    return this.packagingRepository.find({
      relations: {
        product: true,
        packagedBy: true,
        consumptions: {
          batch: true,
        },
      },
      order: {
        packagedAt: 'DESC',
      },
    });
  }

  // ============================================================
  // UPDATE PACKAGING
  // ============================================================

  async updatePackaging(
    id: string,
    dto: UpdatePackagingDto,
  ): Promise<PackagingRecord> {
    const transactionResult = await this.dataSource.transaction(
      async (manager) => {
        const packaging = await manager
          .getRepository(PackagingRecord)
          .createQueryBuilder('packaging')
          .leftJoinAndSelect('packaging.product', 'product')
          .leftJoinAndSelect('packaging.packagedBy', 'packagedBy')
          .setLock('pessimistic_write')
          .where('packaging.id = :id', { id })
          .getOne();

        if (!packaging) {
          throw new NotFoundException('Packaging record not found');
        }

        const previousType = packaging.type;
        const previousProductId = packaging.product.id;
        const previousQuantity = Number(packaging.quantityProduced);
        const previousHoneyUsed = Number(packaging.honeyUsedKg ?? 0);
        const previousPackagedAt = packaging.packagedAt;

        const oldProduct = await this.lockProduct(manager, previousProductId);

        oldProduct.stockQuantity =
          Number(oldProduct.stockQuantity) - previousQuantity;

        if (oldProduct.stockQuantity < 0) {
          throw new BadRequestException(
            'Cannot update packaging because the existing product stock is already lower than the quantity recorded by this packaging entry',
          );
        }

        await manager.save(Product, oldProduct);

        if (previousType === PackagingType.HONEY) {
          await this.restoreHoney(manager, packaging);
        }

        const newProduct =
          dto.productId === previousProductId
            ? oldProduct
            : await this.lockProduct(manager, dto.productId);

        newProduct.stockQuantity =
          Number(newProduct.stockQuantity) + dto.quantityProduced;

        await manager.save(Product, newProduct);

        if (dto.type === PackagingType.HONEY) {
          if (dto.honeyUsedKg === undefined || dto.honeyUsedKg <= 0) {
            throw new BadRequestException(
              'honeyUsedKg is required when packaging honey',
            );
          }

          await this.consumeHoney(manager, packaging, dto.honeyUsedKg);
        }

        packaging.type = dto.type;
        packaging.product = newProduct;
        packaging.quantityProduced = dto.quantityProduced;

        packaging.honeyUsedKg =
          dto.type === PackagingType.HONEY ? dto.honeyUsedKg : undefined;

        packaging.packagedAt = new Date(dto.packagedAt);

        packaging.notes = dto.notes;

        const updatedPackaging = await manager.save(PackagingRecord, packaging);

        const movement = await manager.findOne(InventoryMovement, {
          where: {
            referenceId: packaging.id,
            movementType: InventoryMovementType.PACKAGING,
          },
        });

        if (movement) {
          movement.product = newProduct;
          movement.quantity = dto.quantityProduced;
          movement.notes = dto.notes;

          await manager.save(InventoryMovement, movement);
        } else {
          const replacementMovement = manager.create(InventoryMovement, {
            product: newProduct,
            movementType: InventoryMovementType.PACKAGING,
            quantity: dto.quantityProduced,
            referenceId: packaging.id,
            performedBy: packaging.packagedBy,
            notes: dto.notes,
          });

          await manager.save(InventoryMovement, replacementMovement);
        }

        return {
          record: updatedPackaging,

          auditBefore: {
            type: previousType,
            productId: previousProductId,
            quantityProduced: previousQuantity,
            honeyUsedKg: previousHoneyUsed,
            packagedAt: previousPackagedAt,
          },

          auditAfter: {
            type: updatedPackaging.type,
            productId: updatedPackaging.product.id,
            quantityProduced: updatedPackaging.quantityProduced,
            honeyUsedKg: updatedPackaging.honeyUsedKg,
            packagedAt: updatedPackaging.packagedAt,
          },
        };
      },
    );

    await this.auditLogsService.createLog({
      action: 'UPDATE_PACKAGING',
      entityType: 'PACKAGING',
      entityId: transactionResult.record.id,
      before: transactionResult.auditBefore,
      after: transactionResult.auditAfter,
      metadata: {
        packagingId: transactionResult.record.id,
      },
    });

    return transactionResult.record;
  }
}
