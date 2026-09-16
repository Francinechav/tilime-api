import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';

import { InventoryMovement } from './entities/inventory-movement.entity';

import { Product } from '../products/entities/product.entity';

import { User } from '../users/entities/user.entity';

import { AdjustStockDto } from './dto/adjust-stock.dto';

import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly inventoryRepository: Repository<InventoryMovement>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly auditLogsService: AuditLogsService,

    private readonly dataSource: DataSource,
  ) {}

  async adjustStock(dto: AdjustStockDto): Promise<InventoryMovement> {
    const user = await this.usersRepository.findOne({
      where: {
        id: dto.performedBy,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const savedMovement = await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: {
          id: dto.productId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const previousStock = product.stockQuantity;

      const stockChange = dto.increase ? dto.quantity : -dto.quantity;

      if (!dto.increase && product.stockQuantity < dto.quantity) {
        throw new BadRequestException('Insufficient stock available');
      }

      product.stockQuantity += stockChange;

      await manager.save(Product, product);

      const movement = manager.create(InventoryMovement, {
        product,

        movementType: InventoryMovementType.ADJUSTMENT,

        quantity: stockChange,

        performedBy: user,

        notes: dto.notes,
      });

      const saved = await manager.save(InventoryMovement, movement);

      await this.auditLogsService.createLog({
        action: 'ADJUST_STOCK',

        entityType: 'INVENTORY',

        entityId: saved.id,

        performedBy: user.email,

        before: {
          stockQuantity: previousStock,
        },

        after: {
          stockQuantity: product.stockQuantity,

          adjustmentType: dto.increase ? 'Increase' : 'Decrease',

          quantity: dto.quantity,
        },

        metadata: {
          productName: product.name,
        },
      });

      return saved;
    });

    return savedMovement;
  }

  async getInventoryMovements(): Promise<InventoryMovement[]> {
    return this.inventoryRepository.find({
      relations: {
        product: true,
        performedBy: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .where('product.stockQuantity <= product.lowStockLevel')
      .getMany();
  }
}
