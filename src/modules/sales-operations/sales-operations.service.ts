import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { UpdateSalesOperationDto } from './dto/update-sales-operation.dto';
import { CreateSalesOperationDto } from './dto/create-sales-operation.dto';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { SalesOperation } from './entities/sales-operation.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

import { SalesOperationType } from '../../common/enums/sales-operation-type.enum';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum';

@Injectable()
export class SalesOperationsService {
  constructor(
    @InjectRepository(SalesOperation)
    private readonly operationsRepository: Repository<SalesOperation>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(InventoryMovement)
    private readonly inventoryRepository: Repository<InventoryMovement>,

    private readonly auditLogsService: AuditLogsService,

    private readonly dataSource: DataSource,
  ) {}

  async createOperation(dto: CreateSalesOperationDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const product = await this.lockProduct(manager, dto.productId);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const user = await manager.findOne(User, {
        where: { id: dto.performedBy },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      product.stockQuantity -= dto.quantity;

      await manager.save(Product, product);

      const totalAmount = dto.quantity * dto.unitPrice;

      const operation = manager.create(SalesOperation, {
        product,
        operationType: dto.operationType,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        totalAmount,
        recipient: dto.recipient,
        notes: dto.notes,
        performedBy: user,
        collectedBy: dto.collectedBy,
        operationDate: new Date(dto.operationDate),
      });

      const savedOperation = await manager.save(SalesOperation, operation);

      const movement = manager.create(InventoryMovement, {
        product,
        quantity: -dto.quantity,
        performedBy: user,
        notes: dto.operationType,
        referenceId: savedOperation.id,
        movementType: this.getMovementType(dto.operationType),
      });

      await manager.save(InventoryMovement, movement);

      return {
        operation: savedOperation,
        audit: {
          performedBy: user.email,
          before: undefined,
          after: {
            product: product.name,
            quantity: savedOperation.quantity,
            unitPrice: savedOperation.unitPrice,
            operationType: savedOperation.operationType,
            operationDate: savedOperation.operationDate,
          },
        },
      };
    });

    await this.auditLogsService.createLog({
      action: 'CREATE_SALES_OPERATION',
      entityType: 'SALES_OPERATION',
      entityId: result.operation.id,
      performedBy: result.audit.performedBy,
      before: result.audit.before,
      after: result.audit.after,
    });

    return result.operation;
  }

  async updateOperation(id: string, dto: UpdateSalesOperationDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const operation = await manager.findOne(SalesOperation, {
        where: { id },
        relations: {
          product: true,
          performedBy: true,
        },
      });

      if (!operation) {
        throw new NotFoundException('Operation not found');
      }
      if (!operation.performedBy) {
        throw new NotFoundException('Performed by user not found');
      }

      const performedBy = operation.performedBy;
      const oldProduct = await this.lockProduct(manager, operation.product.id);

      if (!oldProduct) {
        throw new NotFoundException('Original product not found');
      }

      const before = {
        product: oldProduct.name,
        quantity: operation.quantity,
        unitPrice: operation.unitPrice,
        operationType: operation.operationType,
        operationDate: operation.operationDate,
      };

      // Restore stock from the old operation.
      oldProduct.stockQuantity += operation.quantity;

      await manager.save(Product, oldProduct);

      // Lock the new product.
      const product = await this.lockProduct(manager, dto.productId);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      // Apply the new stock deduction.
      product.stockQuantity -= dto.quantity;

      await manager.save(Product, product);

      operation.product = product;
      operation.operationType = dto.operationType;
      operation.quantity = dto.quantity;
      operation.unitPrice = dto.unitPrice;
      operation.totalAmount = dto.quantity * dto.unitPrice;
      operation.operationDate = new Date(dto.operationDate);
      operation.recipient = dto.recipient;
      operation.notes = dto.notes;
      operation.collectedBy = dto.collectedBy;

      const updated = await manager.save(SalesOperation, operation);

      const movement = await manager.findOne(InventoryMovement, {
        where: {
          referenceId: updated.id,
        },
      });

      if (movement) {
        movement.product = product;
        movement.quantity = -dto.quantity;
        movement.notes = dto.operationType;
        movement.movementType = this.getMovementType(dto.operationType);

        await manager.save(InventoryMovement, movement);
      } else {
        const newMovement = manager.create(InventoryMovement, {
          product,
          quantity: -dto.quantity,
          performedBy,
          notes: dto.operationType,
          referenceId: updated.id,
          movementType: this.getMovementType(dto.operationType),
        });

        await manager.save(InventoryMovement, newMovement);
      }

      return {
        operation: updated,
        audit: {
          performedBy: performedBy.email,
          before,
          after: {
            product: product.name,
            quantity: updated.quantity,
            unitPrice: updated.unitPrice,
            operationType: updated.operationType,
            operationDate: updated.operationDate,
          },
        },
      };
    });

    await this.auditLogsService.createLog({
      action: 'UPDATE_SALES_OPERATION',
      entityType: 'SALES_OPERATION',
      entityId: result.operation.id,
      performedBy: result.audit.performedBy,
      before: result.audit.before,
      after: result.audit.after,
    });

    return result.operation;
  }

  async findAll() {
    return this.operationsRepository.find({
      order: {
        operationDate: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async getOperationalRevenue() {
    const operations = await this.operationsRepository.find();

    return operations
      .filter(
        (operation) =>
          operation.operationType !== SalesOperationType.DAMAGE &&
          operation.operationType !== SalesOperationType.STAFF_ALLOCATION,
      )
      .reduce((total, operation) => total + Number(operation.totalAmount), 0);
  }

  private async lockProduct(manager: EntityManager, productId: string) {
    return manager
      .getRepository(Product)
      .createQueryBuilder('product')
      .where('product.id = :productId', { productId })
      .setLock('pessimistic_write')
      .getOne();
  }

  private getMovementType(
    operationType: SalesOperationType,
  ): InventoryMovementType {
    switch (operationType) {
      case SalesOperationType.SHOP_DELIVERY:
        return InventoryMovementType.SHOP_DELIVERY;

      case SalesOperationType.WALK_IN_SALE:
        return InventoryMovementType.WALK_IN_SALE;

      case SalesOperationType.STAFF_ALLOCATION:
        return InventoryMovementType.STAFF_ALLOCATION;

      case SalesOperationType.DAMAGE:
        return InventoryMovementType.DAMAGE;

      default:
        throw new BadRequestException('Invalid sales operation type');
    }
  }
}
