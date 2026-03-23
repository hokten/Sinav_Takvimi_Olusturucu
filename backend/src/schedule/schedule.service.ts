import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from './schedule.gateway';

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private gateway: ScheduleGateway,
  ) {}

  async validateExam(id: string | null, body: any, user: any) {
    let existing = null;
    if (id) {
      existing = await this.prisma.exam.findUnique({ 
        where: { id }, 
        include: { createdBy: true } 
      });
      if (!existing) throw new BadRequestException("Sınav bulunamadı.");
    }

    const programId = body.programId || existing?.programId;

    if (user.role !== 'ADMIN') {
      const targetProgramId = body.programId || existing?.programId;
      const targetProgram = await this.prisma.program.findUnique({ where: { id: targetProgramId } });

      // 1. Paylaşımlı programa sınav EKLEME engeli
      if (!id && targetProgram?.isSharedSource) {
        throw new ForbiddenException("Paylaşımlı (Genel) programa sınav ekleme yetkiniz yok.");
      }

      // 2. Yetki kontrolü (kendi programı mı?)
      if (!targetProgramId || !user.programIds.includes(targetProgramId)) {
        throw new ForbiddenException("Bu program için sınav yönetme yetkiniz yok.");
      }

      if (existing) {
        if (existing.isShared) {
          // 3. Paylaşımlı sınav GÜNCELLEME kısıtı
          const isOnlyUpdatingSupervisors = Object.keys(body).every(key => 
            ['supervisorIds', 'programId'].includes(key) // programId fits the update body usually
          );
          const hadNoSupervisors = existing.supervisorIds.length === 0;

          if (!isOnlyUpdatingSupervisors || !hadNoSupervisors) {
            throw new ForbiddenException("Paylaşımlı sınavlar sadece gözetmen atanmamışsa ve sadece gözetmen eklemek için düzenlenebilir.");
          }
        }
        if (existing.createdBy.role === 'ADMIN' && !existing.isShared) {
          throw new ForbiddenException("Admin tarafından oluşturulan özel sınavlar düzenlenemez.");
        }
      }
    }

    const date = body.date || existing?.date;
    const time = body.time || existing?.time;
    const roomIds = body.roomIds || existing?.roomIds || [];
    const supervisorIds = body.supervisorIds || existing?.supervisorIds || [];

    if (!roomIds || roomIds.length === 0) {
      throw new BadRequestException("Sınav için en az bir derslik seçmelisiniz.");
    }

    if (supervisorIds && supervisorIds.length > 0) {
      if (supervisorIds.length !== roomIds.length) {
        throw new BadRequestException("Atanan gözetmen sayısı, seçilen derslik sayısına eşit olmalıdır (Her salona bir gözetmen).");
      }

      const busySupervisor = await this.prisma.exam.findFirst({
        where: { 
          id: id ? { not: id } : undefined, 
          date, 
          time, 
          supervisorIds: { hasSome: supervisorIds } 
        },
        include: { course: true }
      });
      
      if (busySupervisor) {
        const overlappingName = supervisorIds.find((s: string) => busySupervisor.supervisorIds.includes(s));
        throw new BadRequestException(`Gözetmen "${overlappingName}" bu saatte "${busySupervisor.course.name}" sınavında görevli.`);
      }
    }

    const courseId = body.courseId || existing?.courseId;
    const instructorId = body.instructorId || existing?.instructorId;

    // 1. Prevent multiple Exam records for the SAME course at the same time
    if (courseId) {
      const duplicateCourseExam = await this.prisma.exam.findFirst({
        where: {
          id: id ? { not: id } : undefined,
          courseId,
          date,
          time
        }
      });
      if (duplicateCourseExam) {
        throw new BadRequestException("Bu dersin bu saatte zaten bir sınavı var. Mevcut sınavı düzenleyerek yeni derslikler ekleyebilirsiniz.");
      }
    }

    // 2. Prevent Instructor from having exams for DIFFERENT courses at the same time
    if (instructorId) {
      const instructorConflict = await this.prisma.exam.findFirst({
        where: {
          id: id ? { not: id } : undefined,
          instructorId,
          date,
          time,
          courseId: { not: courseId }
        },
        include: { course: true }
      });
      if (instructorConflict) {
        throw new BadRequestException(`Sorumlu hoca bu saatte zaten "${instructorConflict.course.name}" sınavından sorumlu.`);
      }

      // Check if instructor is busy supervising elsewhere
      const instructor = await this.prisma.instructor.findUnique({ where: { id: instructorId } });
      if (instructor) {
        const instructorBusyElsewhere = await this.prisma.exam.findFirst({
          where: {
            id: id ? { not: id } : undefined,
            date,
            time,
            supervisorIds: { has: instructor.name }
          },
          include: { course: true }
        });
        if (instructorBusyElsewhere) {
          throw new BadRequestException(`Sorumlu hoca "${instructor.name}" bu saatte "${instructorBusyElsewhere.course.name}" sınavında gözetmen olarak görevli.`);
        }
      }
    }

    const targetCourse = await this.prisma.course.findUnique({ 
      where: { id: courseId },
      include: { program: true }
    });
    if (!targetCourse) throw new BadRequestException("Ders bulunamadı.");

    // EXCLUSIVITY RULE: Same program cannot have different courses at the same time.
    const otherCourseInProgram = await this.prisma.exam.findFirst({
      where: {
        id: id ? { not: id } : undefined,
        programId: programId,
        date,
        time,
        course: {
          code: { not: targetCourse.code }
        }
      },
      include: { course: true }
    });
    if (otherCourseInProgram) {
      throw new BadRequestException(`Aynı programda farklı derslerin ("${otherCourseInProgram.course.name}") sınavı aynı oturumda olamaz.`);
    }

    // ALLOW DIFFERENT SECTIONS CONCURRENTLY
    // We no longer block by code. Different sections have different courseIds.
    // Overlaps by room/instructor/supervisor are caught by other checks.

    const overlappingExam = await this.prisma.exam.findFirst({
      where: { 
        id: id ? { not: id } : undefined, 
        date, 
        time, 
        roomIds: { hasSome: roomIds } 
      },
      include: { course: true }
    });
    if (overlappingExam) {
      throw new BadRequestException(`Seçilen salonlardan biri bu saatte "${overlappingExam.course.name}" sınavı/dersliği için dolu.`);
    }

    const overlappingRequest = await this.prisma.slotRequest.findFirst({
      where: {
        date,
        time,
        roomId: { in: roomIds },
        status: 'APPROVED',
        fromProgramId: { not: programId }
      },
      include: { fromProgram: true }
    });
    if (overlappingRequest) {
      throw new BadRequestException(`Seçilen salon bu saatte "${overlappingRequest.fromProgram.name}" programına rezerve edilmiş.`);
    }
  }

  async createExam(body: any, user: any) {
    await this.validateExam(null, body, user);
    
    const program = await this.prisma.program.findUnique({ where: { id: body.programId } });
    const exam = await this.prisma.exam.create({ 
      data: {
        courseId: body.courseId,
        date: body.date,
        time: body.time,
        roomIds: body.roomIds || [],
        supervisorIds: body.supervisorIds || [],
        instructorId: body.instructorId,
        programId: body.programId,
        isShared: program?.isSharedSource ?? false,
        createdById: user.id
      }
    });
    this.gateway.notifyScheduleUpdate();
    return exam;
  }

  async updateExam(id: string, body: any, user: any) {
    await this.validateExam(id, body, user);

    const exam = await this.prisma.exam.update({ 
      where: { id }, 
      data: {
        courseId: body.courseId,
        date: body.date,
        time: body.time,
        roomIds: body.roomIds || [],
        supervisorIds: body.supervisorIds || [],
        instructorId: body.instructorId,
        programId: body.programId,
      }
    });
    this.gateway.notifyScheduleUpdate();
    return exam;
  }

  async deleteExam(id: string, user: any) {
    const existing = await this.prisma.exam.findUnique({ where: { id }, include: { createdBy: true } });
    if (!existing) return { success: false };
    
    if (user.role !== 'ADMIN') {
      if (existing.isShared) throw new ForbiddenException("Paylaşımlı sınav silinemez.");
      if (existing.createdBy.role === 'ADMIN') throw new ForbiddenException("Admin sınavı silinemez.");
      if (!user.programIds.includes(existing.programId)) {
        throw new ForbiddenException("Bu program için sınav yönetme yetkiniz yok.");
      }
    }

    await this.prisma.exam.delete({ where: { id } });
    this.gateway.notifyScheduleUpdate();
    return { success: true };
  }
}
