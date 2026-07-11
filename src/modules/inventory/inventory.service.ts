import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

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
  ) {}

  async adjustStock(dto: AdjustStockDto): Promise<InventoryMovement> {
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
        id: dto.performedBy,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousStock = product.stockQuantity;

    if (dto.increase) {
      product.stockQuantity += dto.quantity;
    } else {
      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException('Insufficient stock available');
      }

      product.stockQuantity -= dto.quantity;
    }

    await this.productsRepository.save(product);

    const movement = this.inventoryRepository.create({
      product,

      movementType: InventoryMovementType.ADJUSTMENT,

      quantity: dto.quantity,

      performedBy: user,

      notes: dto.notes,
    });

    const savedMovement = await this.inventoryRepository.save(movement);

    await this.auditLogsService.createLog({
      action: 'ADJUST_STOCK',

      entityType: 'INVENTORY',

      entityId: savedMovement.id,

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
