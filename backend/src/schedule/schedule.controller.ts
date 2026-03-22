import { Controller, Get, UseGuards, Request, Delete, Param, Post, Put, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScheduleGateway } from './schedule.gateway';
import { ScheduleService } from './schedule.service';

@ApiTags('Schedule')
@ApiBearerAuth()
@Controller('api/schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(
    private prisma: PrismaService,
    private gateway: ScheduleGateway,
    private scheduleService: ScheduleService,
  ) {}

  @ApiOperation({ summary: 'Get all schedule data (Programs, Exams, Instructors, etc.)' })
  @Get('data')
  async getScheduleData(@Request() req: any) {
    const isAdmin = req.user.role === 'ADMIN';
    const userProgramIds = req.user.programIds || [];

    const [
      programs,
      scheduleDays,
      exams,
      rooms,
      instructors,
      courses,
      roomAssignments
    ] = await Promise.all([
      this.prisma.program.findMany({ 
        where: isAdmin ? {} : { id: { in: userProgramIds } },
        orderBy: { name: 'asc' } 
      }),
      this.prisma.scheduleDay.findMany({ orderBy: { date: 'asc' } }),
      this.prisma.exam.findMany({ 
        where: isAdmin ? {} : { 
          OR: [
            { programId: { in: userProgramIds } },
            { isShared: true }
          ]
        },
        include: { 
          course: { include: { instructor: true, program: true } }, 
          instructor: true, 
          program: true,
          deptSupervisors: true,
          createdBy: { select: { role: true } }
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }]
      }),
      this.prisma.room.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.instructor.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.course.findMany({ 
        where: isAdmin ? {} : { 
          OR: [
            { programId: { in: userProgramIds } },
            { program: { isSharedSource: true } }
          ]
        },
        include: { instructor: true, program: true } 
      }),
      this.prisma.roomAssignment.findMany()
    ]);
    
    return {
      programs,
      editableProgramIds: programs.map(p => p.id),
      sharedSourceProgramIds: (await this.prisma.program.findMany({ where: { isSharedSource: true }, select: { id: true } })).map(p => p.id),
      scheduleDays,
      exams,
      allExams: exams,
      rooms,
      instructors,
      courses,
      roomAssignments,
      approvedReservations: [],
      session: { user: req.user }
    };
  }

  @ApiOperation({ summary: 'Check if a supervisor has a conflict at a specific date/time' })
  @ApiQuery({ name: 'supervisorName', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'time', required: true })
  @ApiQuery({ name: 'excludeExamId', required: false })
  @Get('check-conflict')
  async checkSupervisorConflict(
    @Query('supervisorName') supervisorName: string,
    @Query('date') date: string,
    @Query('time') time: string,
    @Query('excludeExamId') excludeExamId?: string
  ) {
    const conflict = await this.prisma.exam.findFirst({
      where: {
        supervisorIds: { has: supervisorName },
        date,
        time,
        ...(excludeExamId ? { NOT: { id: excludeExamId } } : {})
      },
      include: { course: true }
    });
    if (conflict) return { conflict: true, message: `Bu gözetmen bu saatte "${conflict.course.name}" sınavında görevlidir.` };
    return { conflict: false };
  }

  @ApiOperation({ summary: 'Create a new exam' })
  @ApiBody({ schema: { type: 'object' } })
  @Post('exams')
  async createExam(@Body() body: any, @Request() req: any) {
    return this.scheduleService.createExam(body, req.user);
  }

  @ApiOperation({ summary: 'Update an existing exam' })
  @ApiBody({ schema: { type: 'object' } })
  @Put('exams/:id')
  async updateExam(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.scheduleService.updateExam(id, body, req.user);
  }

  @ApiOperation({ summary: 'Delete an exam' })
  @Delete('exams/:id')
  async deleteExam(@Param('id') id: string, @Request() req: any) {
    return this.scheduleService.deleteExam(id, req.user);
  }

  @ApiOperation({ summary: 'Update shared supervisors for an exam' })
  @ApiBody({ schema: { type: 'object' } })
  @Post('exams/:id/shared-supervisors')
  async updateSharedSupervisors(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const { programId, supervisorIds } = body;
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new Error("Sınav bulunamadı.");
    if (!exam.isShared) throw new Error("Bu sınav paylaşımlı değil.");

    if (req.user.role !== 'ADMIN' && !req.user.programIds.includes(programId)) {
      throw new Error("Yetkiniz yok.");
    }

    await this.prisma.sharedExamSupervisors.upsert({
      where: { examId_programId: { examId: id, programId } },
      create: { examId: id, programId, supervisorIds },
      update: { supervisorIds }
    });
    this.gateway.notifyScheduleUpdate();
    return { success: true };
  }

  @ApiOperation({ summary: 'Assign supervisors to an admin-created exam' })
  @ApiBody({ schema: { type: 'object' } })
  @Post('exams/:id/admin-supervisors')
  async assignSupervisorsToAdminExam(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const { supervisorIds } = body;
    const exam = await this.prisma.exam.findUnique({ where: { id }, include: { createdBy: true } });
    if (!exam) throw new Error("Sınav bulunamadı.");
    if (exam.isShared) throw new Error("Paylaşımlı sınavlar bu yöntemle güncellenemez.");
    if (exam.createdBy.role !== 'ADMIN') throw new Error("Bu sınav admin tarafından oluşturulmamış.");
    if (exam.supervisorIds.length > 0 && req.user.role !== 'ADMIN') throw new Error("Bu sınavın gözetmenleri zaten belirlenmiş.");

    if (req.user.role !== 'ADMIN' && !req.user.programIds.includes(exam.programId)) {
      throw new Error("Yetki yok.");
    }
    await this.prisma.exam.update({ where: { id }, data: { supervisorIds } });
    this.gateway.notifyScheduleUpdate();
    return { success: true };
  }
}
