import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RoomAssignmentsService } from './room-assignments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/room-assignments')
@UseGuards(JwtAuthGuard)
export class RoomAssignmentsController {
  constructor(private readonly service: RoomAssignmentsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post('toggle')
  toggle(@Body() body: { roomId: string, programId: string }) {
    return this.service.toggle(body.roomId, body.programId);
  }
}
