import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll() { return this.programsService.findAll(); }

  @Post()
  create(@Body() body: any) { return this.programsService.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.programsService.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.programsService.remove(id); }
}
