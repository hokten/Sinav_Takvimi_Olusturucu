"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_gateway_1 = require("./schedule.gateway");
let ScheduleService = class ScheduleService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async validateExam(id, body, user) {
        let existing = null;
        if (id) {
            existing = await this.prisma.exam.findUnique({
                where: { id },
                include: { createdBy: true }
            });
            if (!existing)
                throw new common_1.BadRequestException("Sınav bulunamadı.");
        }
        const programId = body.programId || existing?.programId;
        if (user.role !== 'ADMIN') {
            const targetProgramId = body.programId || existing?.programId;
            const targetProgram = await this.prisma.program.findUnique({ where: { id: targetProgramId } });
            let departmentId = user.departmentId;
            let userProgramIds = user.programIds || [];
            if (!departmentId || userProgramIds.length <= 1) {
                const dbUser = (await this.prisma.user.findUnique({
                    where: { id: user.id },
                    include: { programs: true }
                }));
                if (dbUser) {
                    departmentId = dbUser.departmentId;
                    userProgramIds = dbUser.programs.map((p) => p.programId);
                }
            }
            if (!id && targetProgram?.isSharedSource) {
                throw new common_1.ForbiddenException("Paylaşımlı (Genel) programa sınav ekleme yetkiniz yok.");
            }
            const isUserProgram = userProgramIds.includes(targetProgramId);
            const isDeptProgram = departmentId && targetProgram?.departmentId === departmentId;
            if (!targetProgramId || (!isUserProgram && !isDeptProgram)) {
                throw new common_1.ForbiddenException("Bu program için sınav yönetme yetkiniz yok.");
            }
            if (existing) {
                if (existing.isShared) {
                    const isOnlyUpdatingSupervisors = Object.keys(body).every(key => ['supervisorIds', 'programId'].includes(key));
                    const hadNoSupervisors = existing.supervisorIds.length === 0;
                    if (!isOnlyUpdatingSupervisors || !hadNoSupervisors) {
                        throw new common_1.ForbiddenException("Paylaşımlı sınavlar sadece gözetmen atanmamışsa ve sadece gözetmen eklemek için düzenlenebilir.");
                    }
                }
                if (existing.createdBy.role === 'ADMIN' && !existing.isShared) {
                    throw new common_1.ForbiddenException("Admin tarafından oluşturulan özel sınavlar düzenlenemez.");
                }
            }
        }
        const date = body.date || existing?.date;
        const time = body.time || existing?.time;
        const roomIds = body.roomIds || existing?.roomIds || [];
        const supervisorIds = body.supervisorIds || existing?.supervisorIds || [];
        if (!roomIds || roomIds.length === 0) {
            throw new common_1.BadRequestException("Sınav için en az bir derslik seçmelisiniz.");
        }
        if (supervisorIds && supervisorIds.length > 0) {
            if (supervisorIds.length !== roomIds.length) {
                throw new common_1.BadRequestException("Atanan gözetmen sayısı, seçilen derslik sayısına eşit olmalıdır (Her salona bir gözetmen).");
            }
        }
        if (supervisorIds && supervisorIds.length > 0) {
            const busyAsSup = await this.prisma.exam.findFirst({
                where: {
                    id: id ? { not: id } : undefined,
                    date,
                    time,
                    supervisorIds: { hasSome: supervisorIds }
                },
                include: { course: true }
            });
            if (busyAsSup) {
                const name = supervisorIds.find((s) => busyAsSup.supervisorIds.includes(s));
                throw new common_1.BadRequestException(`Gözetmen "${name}" bu saatte "${busyAsSup.course.name}" sınavında zaten gözetmen.`);
            }
            const busyAsInst = await this.prisma.exam.findFirst({
                where: {
                    id: id ? { not: id } : undefined,
                    date,
                    time,
                    instructor: { name: { in: supervisorIds } }
                },
                include: { course: true, instructor: true }
            });
            if (busyAsInst) {
                throw new common_1.BadRequestException(`Gözetmen "${busyAsInst.instructor.name}" bu saatte "${busyAsInst.course.name}" sınavının ders sorumlusu olduğu için gözetmenlik yapamaz.`);
            }
        }
        const courseId = body.courseId || existing?.courseId;
        const instructorId = body.instructorId || existing?.instructorId;
        const instructor = instructorId ? await this.prisma.instructor.findUnique({ where: { id: instructorId } }) : null;
        if (courseId) {
            const duplicateCourseExam = await this.prisma.exam.findFirst({
                where: { id: id ? { not: id } : undefined, courseId, date, time }
            });
            if (duplicateCourseExam) {
                throw new common_1.BadRequestException("Bu dersin bu saatte zaten bir sınavı var.");
            }
        }
        const targetCourse = courseId ? await this.prisma.course.findUnique({
            where: { id: courseId },
            include: { program: true }
        }) : null;
        if (!targetCourse && courseId)
            throw new common_1.BadRequestException("Ders bulunamadı.");
        if (instructorId && instructor) {
            const busyAsSup = await this.prisma.exam.findFirst({
                where: {
                    id: id ? { not: id } : undefined,
                    date,
                    time,
                    supervisorIds: { has: instructor.name }
                },
                include: { course: true }
            });
            if (busyAsSup) {
                throw new common_1.BadRequestException(`Hoca "${instructor.name}" bu saatte "${busyAsSup.course.name}" sınavında gözetmen olduğu için başka bir sınava atanamaz.`);
            }
            const otherInstRole = await this.prisma.exam.findFirst({
                where: {
                    id: id ? { not: id } : undefined,
                    instructorId,
                    date,
                    time,
                    courseId: { not: courseId }
                },
                include: { course: { include: { program: true } } }
            });
            if (otherInstRole && targetCourse) {
                if (otherInstRole.course.programId === targetCourse.programId) {
                    throw new common_1.BadRequestException(`Hoca "${instructor.name}" aynı programda ("${targetCourse.program.name}") bu saatte zaten "${otherInstRole.course.name}" sınavından sorumlu.`);
                }
            }
        }
        if (targetCourse) {
            const otherCourseInProgram = await this.prisma.exam.findFirst({
                where: {
                    id: id ? { not: id } : undefined,
                    programId: targetCourse.programId,
                    date,
                    time,
                    course: { code: { not: targetCourse.code } }
                },
                include: { course: true }
            });
            if (otherCourseInProgram) {
                throw new common_1.BadRequestException(`Aynı programda farklı derslerin ("${otherCourseInProgram.course.name}") sınavı aynı oturumda olamaz.`);
            }
        }
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
            throw new common_1.BadRequestException(`Seçilen salonlardan biri bu saatte "${overlappingExam.course.name}" sınavı/dersliği için dolu.`);
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
            throw new common_1.BadRequestException(`Seçilen salon bu saatte "${overlappingRequest.fromProgram.name}" programına rezerve edilmiş.`);
        }
        const pendingRequest = await this.prisma.slotRequest.findFirst({
            where: {
                date,
                time,
                roomId: { in: roomIds },
                status: 'PENDING'
            },
            include: { room: true }
        });
        if (pendingRequest) {
            throw new common_1.BadRequestException(`"${pendingRequest.room.name}" salonu için bekleyen bir rezervasyon talebi var. Lütfen önce bu talebi (onaylayarak veya reddederek) sonuçlandırın.`);
        }
    }
    async createExam(body, user) {
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
    async updateExam(id, body, user) {
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
    async deleteExam(id, user) {
        const existing = await this.prisma.exam.findUnique({ where: { id }, include: { createdBy: true } });
        if (!existing)
            return { success: false };
        if (user.role !== 'ADMIN') {
            if (existing.isShared)
                throw new common_1.ForbiddenException("Paylaşımlı sınav silinemez.");
            if (existing.createdBy.role === 'ADMIN')
                throw new common_1.ForbiddenException("Admin sınavı silinemez.");
            const targetProgram = await this.prisma.program.findUnique({ where: { id: existing.programId } });
            let departmentId = user.departmentId;
            let userProgramIds = user.programIds || [];
            if (!departmentId || userProgramIds.length <= 1) {
                const dbUser = await this.prisma.user.findUnique({
                    where: { id: user.id },
                    include: { programs: true }
                });
                if (dbUser) {
                    departmentId = dbUser.departmentId;
                    userProgramIds = dbUser.programs.map((p) => p.programId);
                }
            }
            const isUserProgram = userProgramIds.includes(existing.programId);
            const isDeptProgram = departmentId && targetProgram?.departmentId === departmentId;
            if (!isUserProgram && !isDeptProgram) {
                throw new common_1.ForbiddenException("Bu program için sınav yönetme yetkiniz yok.");
            }
        }
        await this.prisma.exam.delete({ where: { id } });
        this.gateway.notifyScheduleUpdate();
        return { success: true };
    }
};
exports.ScheduleService = ScheduleService;
exports.ScheduleService = ScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        schedule_gateway_1.ScheduleGateway])
], ScheduleService);
//# sourceMappingURL=schedule.service.js.map