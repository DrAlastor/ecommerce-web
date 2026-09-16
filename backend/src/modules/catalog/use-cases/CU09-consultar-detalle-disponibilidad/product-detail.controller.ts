import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductDetailService } from './product-detail.service.js';
import type { ProductDetailResponseDto } from './dto/product-detail.dto.js';

@Controller('catalog/products')
export class ProductDetailController {
  constructor(private readonly productDetailService: ProductDetailService) {}

  @Get(':id')
  async getProductDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductDetailResponseDto> {
    return this.productDetailService.getProductDetail(id);
  }
}
