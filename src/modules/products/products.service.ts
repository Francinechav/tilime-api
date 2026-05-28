import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

import { UpdateProductDto } from './dto/update-product.dto';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createCategory(
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    const existingCategory = await this.categoriesRepository.findOne({
      where: {
        name: dto.name,
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category already exists');
    }

    const category = this.categoriesRepository.create(dto);

    return this.categoriesRepository.save(category);
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.productsRepository.findOne({
      where: {
        sku: dto.sku,
      },
    });

    if (existingProduct) {
      throw new ConflictException('Product SKU already exists');
    }

    const category = await this.categoriesRepository.findOne({
      where: {
        id: dto.categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const newProduct = this.productsRepository.create({
      ...dto,
      category,
    });

    const savedProduct: Product =
      await this.productsRepository.save(newProduct);

    await this.auditLogsService.createLog({
      action: 'CREATE_PRODUCT',

      entityType: 'PRODUCT',

      entityId: savedProduct.id,

      metadata: {
        productName: savedProduct.name,

        sku: savedProduct.sku,
      },
    });

    return savedProduct;
  }

  async findAllProducts(): Promise<Product[]> {
    return this.productsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllCategories(): Promise<ProductCategory[]> {
    return this.categoriesRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },

      relations: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    /*
   ✅ SAVE OLD VALUES
  */

    const oldProduct = {
      name: product.name,

      price: product.price,

      stockQuantity: product.stockQuantity,

      lowStockLevel: product.lowStockLevel,

      imageUrl: product.imageUrl,
    };

    if (dto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: {
          id: dto.categoryId,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      product.category = category;
    }

    Object.assign(product, dto);

    const updatedProduct: Product = await this.productsRepository.save(product);

    /*
   ✅ CREATE ADVANCED AUDIT LOG
  */

    await this.auditLogsService.createLog({
      action: 'UPDATE_PRODUCT',

      entityType: 'PRODUCT',

      entityId: updatedProduct.id,

      performedBy: 'Admin',

      before: oldProduct,

      after: {
        name: updatedProduct.name,

        price: updatedProduct.price,

        stockQuantity: updatedProduct.stockQuantity,

        lowStockLevel: updatedProduct.lowStockLevel,

        imageUrl: updatedProduct.imageUrl,
      },

      metadata: {
        updatedFields: Object.keys(dto),
      },
    });

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.auditLogsService.createLog({
      action: 'DELETE_PRODUCT',

      entityType: 'PRODUCT',

      entityId: product.id,

      metadata: {
        productName: product.name,
      },
    });

    await this.productsRepository.remove(product);

    return {
      message: 'Product deleted successfully',
    };
  }
}
