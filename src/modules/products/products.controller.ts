import { Body, Controller, Get, Post } from '@nestjs/common';

import { ProductsService } from './products.service';

import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { Delete, Param, Patch } from '@nestjs/common';

import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('categories')
  createCategory(
    @Body()
    dto: CreateProductCategoryDto,
  ) {
    return this.productsService.createCategory(dto);
  }

  @Get('categories')
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Post()
  createProduct(
    @Body()
    dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(dto);
  }

  @Get()
  findAllProducts() {
    return this.productsService.findAllProducts();
  }

  @Patch(':id')
  updateProduct(
    @Param('id') id: string,

    @Body()
    dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
