import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll() { return this.departmentsService.findAll(); }

  @Post()
  create(@Body() body: { name: string }) { return this.departmentsService.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { name: string }) { return this.departmentsService.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.departmentsService.remove(id); }
}
