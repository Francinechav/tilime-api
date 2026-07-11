import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateSalesOperationDto } from './dto/update-sales-operation.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';

import { User } from '../users/entities/user.entity';

import { SalesOperation } from './entities/sales-operation.entity';

import { CreateSalesOperationDto } from './dto/create-sales-operation.dto';

import { SalesOperationType } from '../../common/enums/sales-operation-type.enum';

import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

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
  ) {}

  async createOperation(dto: CreateSalesOperationDto) {
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

    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stockQuantity -= dto.quantity;

    await this.productsRepository.save(product);

    const totalAmount = dto.quantity * dto.unitPrice;

    const operation = this.operationsRepository.create({
      product,

      operationType: dto.operationType,

      quantity: dto.quantity,

      unitPrice: dto.unitPrice,

      totalAmount,

      recipient: dto.recipient,

      notes: dto.notes,

      performedBy: user,
    });

    const savedOperation = await this.operationsRepository.save(operation);

    const movement = this.inventoryRepository.create({
      product,

      quantity: dto.quantity,

      performedBy: {
        id: user.id,
      } as User,

      notes: dto.operationType,
      referenceId: savedOperation.id,

      movementType: dto.operationType as unknown as InventoryMovementType,
    });

    const savedMovement = await this.inventoryRepository.save(movement);

    const fullMovement = await this.inventoryRepository.findOne({
      where: {
        id: savedMovement.id,
      },

      relations: {
        product: true,
        performedBy: true,
      },
    });

    console.log(fullMovement);

    return savedOperation;
  }
  async updateOperation(id: string, dto: UpdateSalesOperationDto) {
    const operation = await this.operationsRepository.findOne({
      where: { id },
      relations: {
        product: true,
        performedBy: true,
      },
    });

    if (!operation) {
      throw new NotFoundException('Operation not found');
    }

    const oldProduct = operation.product;

    // Restore previous stock
    oldProduct.stockQuantity += operation.quantity;

    await this.productsRepository.save(oldProduct);

    const product = await this.productsRepository.findOne({
      where: {
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const before = {
      product: operation.product.name,
      quantity: operation.quantity,
      unitPrice: operation.unitPrice,
      operationType: operation.operationType,
    };

    // Apply new stock deduction
    product.stockQuantity -= dto.quantity;

    await this.productsRepository.save(product);

    operation.product = product;
    operation.operationType = dto.operationType;
    operation.quantity = dto.quantity;
    operation.unitPrice = dto.unitPrice;
    operation.totalAmount = dto.quantity * dto.unitPrice;
    operation.recipient = dto.recipient;
    operation.notes = dto.notes;

    const updated = await this.operationsRepository.save(operation);

    const movement = await this.inventoryRepository.findOne({
      where: {
        referenceId: updated.id,
      },
    });

    if (movement) {
      movement.product = product;
      movement.quantity = dto.quantity;
      movement.notes = dto.operationType;
      movement.movementType =
        dto.operationType as unknown as InventoryMovementType;

      await this.inventoryRepository.save(movement);
    }

    await this.auditLogsService.createLog({
      action: 'UPDATE_SALES_OPERATION',

      entityType: 'SALES_OPERATION',

      entityId: updated.id,

      performedBy: operation.performedBy.email,

      before,

      after: {
        product: product.name,
        quantity: updated.quantity,
        unitPrice: updated.unitPrice,
        operationType: updated.operationType,
      },
    });

    return updated;
  }
  async findAll() {
    return this.operationsRepository.find({
      order: {
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
      .reduce(
        (total, operation) => total + Number(operation.totalAmount),

        0,
      );
  }
}
