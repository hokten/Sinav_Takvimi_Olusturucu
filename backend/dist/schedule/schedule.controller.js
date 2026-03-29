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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const schedule_gateway_1 = require("./schedule.gateway");
const schedule_service_1 = require("./schedule.service");
let ScheduleController = class ScheduleController {
    prisma;
    gateway;
    scheduleService;
    constructor(prisma, gateway, scheduleService) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.scheduleService = scheduleService;
    }
    async getScheduleData(req) {
        const isAdmin = req.user.role === 'ADMIN';
        let initialUserProgramIds = req.user.programIds || [];
        let departmentId = req.user.departmentId;
        let userProgramIds = [...initialUserProgramIds];
        if (!departmentId || userProgramIds.length === 0) {
            const dbUser = (await this.prisma.user.findUnique({
                where: { id: req.user.id },
                include: { programs: true }
            }));
            if (dbUser) {
                departmentId = dbUser.departmentId;
                userProgramIds = dbUser.programs.map((p) => p.programId);
            }
        }
        if (!isAdmin && departmentId) {
            const deptPrograms = await this.prisma.program.findMany({
                where: { departmentId },
                select: { id: true }
            });
            const deptProgramIds = deptPrograms.map(p => p.id);
            userProgramIds = [...new Set([...userProgramIds, ...deptProgramIds])];
        }
        const [programs, scheduleDays, exams, rooms, instructors, courses, roomAssignments] = await Promise.all([
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
        const allExamsData = await this.prisma.exam.findMany({
            include: {
                course: { include: { instructor: true, program: true } },
                instructor: true,
                program: true,
                deptSupervisors: true,
                createdBy: { select: { role: true } }
            },
            orderBy: [{ date: 'asc' }, { time: 'asc' }]
        });
        const dbUser = await this.prisma.user.findUnique({ where: { id: req.user.id } });
        return {
            programs,
            editableProgramIds: programs.map(p => p.id),
            sharedSourceProgramIds: (await this.prisma.program.findMany({ where: { isSharedSource: true }, select: { id: true } })).map(p => p.id),
            scheduleDays,
            exams,
            allExams: allExamsData,
            rooms,
            instructors,
            courses,
            allPrograms: await this.prisma.program.findMany({ orderBy: { name: 'asc' } }),
            allCourses: await this.prisma.course.findMany({ include: { instructor: true, program: true } }),
            roomAssignments,
            approvedReservations: (await this.prisma.slotRequest.findMany({
                where: { status: 'APPROVED' },
                include: { fromProgram: { select: { name: true, color: true } } }
            })).map(r => ({
                roomId: r.roomId,
                date: r.date,
                time: r.time,
                fromProgramId: r.fromProgramId,
                fromProgram: r.fromProgram
            })),
            session: { user: { ...req.user, departmentId: dbUser?.departmentId } }
        };
    }
    async checkSupervisorConflict(supervisorName, date, time, excludeExamId) {
        const conflict = await this.prisma.exam.findFirst({
            where: {
                supervisorIds: { has: supervisorName },
                date,
                time,
                ...(excludeExamId ? { NOT: { id: excludeExamId } } : {})
            },
            include: { course: true }
        });
        if (conflict)
            return { conflict: true, message: `Bu gözetmen bu saatte "${conflict.course.name}" sınavında görevlidir.` };
        return { conflict: false };
    }
    async createExam(body, req) {
        return this.scheduleService.createExam(body, req.user);
    }
    async updateExam(id, body, req) {
        return this.scheduleService.updateExam(id, body, req.user);
    }
    async deleteExam(id, req) {
        return this.scheduleService.deleteExam(id, req.user);
    }
    async updateSharedSupervisors(id, body, req) {
        const { programId, supervisorIds } = body;
        const exam = await this.prisma.exam.findUnique({ where: { id } });
        if (!exam)
            throw new Error("Sınav bulunamadı.");
        if (!exam.isShared)
            throw new Error("Bu sınav paylaşımlı değil.");
        const dbUser = await this.prisma.user.findUnique({ where: { id: req.user.id } });
        const targetProgram = await this.prisma.program.findUnique({ where: { id: programId } });
        if (req.user.role !== 'ADMIN' && !req.user.programIds.includes(programId) && dbUser?.departmentId !== targetProgram?.departmentId) {
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
    async assignSupervisorsToAdminExam(id, body, req) {
        const { supervisorIds } = body;
        const exam = await this.prisma.exam.findUnique({ where: { id }, include: { createdBy: true } });
        if (!exam)
            throw new Error("Sınav bulunamadı.");
        if (exam.isShared)
            throw new Error("Paylaşımlı sınavlar bu yöntemle güncellenemez.");
        if (exam.createdBy.role !== 'ADMIN')
            throw new Error("Bu sınav admin tarafından oluşturulmamış.");
        if (exam.supervisorIds.length > 0 && req.user.role !== 'ADMIN')
            throw new Error("Bu sınavın gözetmenleri zaten belirlenmiş.");
        const dbUser = await this.prisma.user.findUnique({ where: { id: req.user.id } });
        const targetProgram = await this.prisma.program.findUnique({ where: { id: exam.programId } });
        if (req.user.role !== 'ADMIN' && !req.user.programIds.includes(exam.programId) && dbUser?.departmentId !== targetProgram?.departmentId) {
            throw new Error("Yetki yok.");
        }
        await this.prisma.exam.update({ where: { id }, data: { supervisorIds } });
        this.gateway.notifyScheduleUpdate();
        return { success: true };
    }
};
exports.ScheduleController = ScheduleController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all schedule data (Programs, Exams, Instructors, etc.)' }),
    (0, common_1.Get)('data'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "getScheduleData", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Check if a supervisor has a conflict at a specific date/time' }),
    (0, swagger_1.ApiQuery)({ name: 'supervisorName', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'time', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'excludeExamId', required: false }),
    (0, common_1.Get)('check-conflict'),
    __param(0, (0, common_1.Query)('supervisorName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('time')),
    __param(3, (0, common_1.Query)('excludeExamId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "checkSupervisorConflict", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new exam' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    (0, common_1.Post)('exams'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "createExam", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing exam' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    (0, common_1.Put)('exams/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "updateExam", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete an exam' }),
    (0, common_1.Delete)('exams/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "deleteExam", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update shared supervisors for an exam' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    (0, common_1.Post)('exams/:id/shared-supervisors'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "updateSharedSupervisors", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Assign supervisors to an admin-created exam' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object' } }),
    (0, common_1.Post)('exams/:id/admin-supervisors'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "assignSupervisorsToAdminExam", null);
exports.ScheduleController = ScheduleController = __decorate([
    (0, swagger_1.ApiTags)('Schedule'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/schedule'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        schedule_gateway_1.ScheduleGateway,
        schedule_service_1.ScheduleService])
], ScheduleController);
//# sourceMappingURL=schedule.controller.js.map