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
            if (!id && targetProgram?.isSharedSource) {
                throw new common_1.ForbiddenException("Paylaşımlı (Genel) programa sınav ekleme yetkiniz yok.");
            }
            if (!targetProgramId || !user.programIds.includes(targetProgramId)) {
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
                const overlappingName = supervisorIds.find((s) => busySupervisor.supervisorIds.includes(s));
                throw new common_1.BadRequestException(`Gözetmen "${overlappingName}" bu saatte "${busySupervisor.course.name}" sınavında görevli.`);
            }
        }
        const courseId = body.courseId || existing?.courseId;
        const instructorId = body.instructorId || existing?.instructorId;
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
                throw new common_1.BadRequestException("Bu dersin bu saatte zaten bir sınavı var. Mevcut sınavı düzenleyerek yeni derslikler ekleyebilirsiniz.");
            }
        }
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
                throw new common_1.BadRequestException(`Sorumlu hoca bu saatte zaten "${instructorConflict.course.name}" sınavından sorumlu.`);
            }
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
                    throw new common_1.BadRequestException(`Sorumlu hoca "${instructor.name}" bu saatte "${instructorBusyElsewhere.course.name}" sınavında gözetmen olarak görevli.`);
                }
            }
        }
        const targetCourse = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: { program: true }
        });
        if (!targetCourse)
            throw new common_1.BadRequestException("Ders bulunamadı.");
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
            throw new common_1.BadRequestException(`Aynı programda farklı derslerin ("${otherCourseInProgram.course.name}") sınavı aynı oturumda olamaz.`);
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
            if (!user.programIds.includes(existing.programId)) {
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