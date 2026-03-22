import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get() 
  findAll() { return this.roomsService.findAll(); }

  @Post() 
  create(@Body() body: any) { return this.roomsService.create(body); }

  @Put(':id') 
  update(@Param('id') id: string, @Body() body: any) { return this.roomsService.update(id, body); }

  @Delete(':id') 
  remove(@Param('id') id: string) { return this.roomsService.remove(id); }
}
