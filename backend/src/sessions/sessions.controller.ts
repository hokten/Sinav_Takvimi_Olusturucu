import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get() findAll() { return this.sessionsService.findAll(); }

  @Post() create(@Body() body: any) { return this.sessionsService.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() sessions: string[]) { return this.sessionsService.update(id, sessions); }
  @Delete(':id') remove(@Param('id') id: string) { return this.sessionsService.remove(id); }
}
