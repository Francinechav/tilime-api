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

    const outgoingMovements = [
      InventoryMovementType.WEBSITE_ORDER,

      InventoryMovementType.SHOP_DELIVERY,

      InventoryMovementType.STAFF_ALLOCATION,

      InventoryMovementType.DAMAGE,
    ];

    const isOutgoing = outgoingMovements.includes(dto.movementType);

    if (isOutgoing && product.stockQuantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    if (isOutgoing) {
      product.stockQuantity -= dto.quantity;
    } else {
      product.stockQuantity += dto.quantity;
    }

    await this.productsRepository.save(product);

    const movement = this.inventoryRepository.create({
      product,

      movementType: dto.movementType,

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

        movementType: dto.movementType,

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
