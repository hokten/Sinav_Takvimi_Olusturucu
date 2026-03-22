import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get() findAll() { return this.coursesService.findAll(); }
  @Post() create(@Body() body: any) { return this.coursesService.create(body); }
  @Post('import') importCourses(@Body() body: { rows: any[] }) { return this.coursesService.importCourses(body.rows); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.coursesService.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.coursesService.remove(id); }
}
