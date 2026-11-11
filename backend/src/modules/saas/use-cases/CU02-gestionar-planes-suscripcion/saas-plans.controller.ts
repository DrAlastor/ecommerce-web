import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SaasPlansService } from './saas-plans.service.js';
import { CreateSaasPlanDto, UpdateSaasPlanDto } from './saas-plans.dto.js';
import { SaasSuperAdminGuard } from '../../guards/saas-superadmin.guard.js';

@Controller('saas/plans')
@UseGuards(SaasSuperAdminGuard)
export class SaasPlansController {
  constructor(private readonly plansService: SaasPlansService) {}

  @Get()
  async findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateSaasPlanDto, @Req() req: any) {
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    const user = req.user;
    return this.plansService.create(dto, user, ip);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSaasPlanDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    const user = req.user;
    return this.plansService.update(id, dto, user, ip);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    const user = req.user;
    return this.plansService.delete(id, user, ip);
  }
}

