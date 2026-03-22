import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.requestsService.findAll(req.user.role, req.user.programIds || []);
  }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.requestsService.create(body, req.user.role, req.user.programIds || []);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.approve(id, req.user.programIds || [], req.user.role);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.reject(id, req.user.programIds || [], req.user.role);
  }

  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.withdraw(id, req.user.programIds || [], req.user.role);
  }
}
