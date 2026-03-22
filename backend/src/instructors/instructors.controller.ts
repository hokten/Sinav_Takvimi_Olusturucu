import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from '@nestjs/common';

@Controller('api/instructors')
@UseGuards(JwtAuthGuard)
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.instructorsService.getStats(req.user);
  }

  @Get() 
  findAll() { return this.instructorsService.findAll(); }

  @Post() 
  create(@Body() body: any) { return this.instructorsService.create(body); }

  @Put(':id') 
  update(@Param('id') id: string, @Body() body: any) { return this.instructorsService.update(id, body); }

  @Delete(':id') 
  remove(@Param('id') id: string) { return this.instructorsService.remove(id); }
}
