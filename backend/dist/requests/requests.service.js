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
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_gateway_1 = require("../schedule/schedule.gateway");
let RequestsService = class RequestsService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async findAll(userRole, userProgramIds) {
        const allRequests = await this.prisma.slotRequest.findMany({
            include: {
                fromProgram: true,
                room: { include: { assignments: { include: { program: true } } } },
                approvals: { include: { program: true } },
            },
            orderBy: { id: 'desc' }
        });
        return allRequests.map(req => ({
            id: req.id,
            fromProgramId: req.fromProgramId,
            roomId: req.roomId,
            date: req.date,
            time: req.time,
            status: req.status,
            fromProgram: req.fromProgram,
            room: req.room,
            ownerProgramIds: req.room.assignments.map(a => a.programId),
            ownerPrograms: req.room.assignments.map(a => a.program),
            approvals: req.approvals
        }));
    }
    async create(data, userRole, userProgramIds) {
        if (userRole !== 'DEPT_HEAD' && userRole !== 'ADMIN')
            throw new common_1.ForbiddenException("Yetkiniz yok.");
        if (!data.programId || (!userProgramIds.includes(data.programId) && userRole !== 'ADMIN')) {
            throw new common_1.ForbiddenException("Bu program için talep oluşturamazsınız.");
        }
        const room = await this.prisma.room.findUnique({
            where: { id: data.roomId },
            include: { assignments: true }
        });
        if (room && room.assignments.some(a => a.programId === data.programId)) {
            throw new common_1.BadRequestException("Bu salon zaten programınıza atanmış durumda, kendi salonunuz için talep oluşturamazsınız.");
        }
        const approvedSlot = await this.prisma.slotRequest.findFirst({
            where: {
                roomId: data.roomId,
                date: data.date,
                time: data.time,
                status: "APPROVED",
            },
        });
        if (approvedSlot) {
            throw new common_1.BadRequestException("Bu slot halihazırda onaylanmış ve başka bir program tarafından rezerve edilmiştir.");
        }
        const existing = await this.prisma.slotRequest.findFirst({
            where: {
                fromProgramId: data.programId,
                roomId: data.roomId,
                date: data.date,
                time: data.time,
                status: { in: ["PENDING", "APPROVED", "REJECTED"] },
            },
        });
        if (existing)
            throw new common_1.BadRequestException("Bu slot için zaten aktif bir talebiniz mevcut.");
        const result = await this.prisma.slotRequest.create({
            data: {
                fromProgramId: data.programId,
                roomId: data.roomId,
                date: data.date,
                time: data.time
            },
        });
        this.gateway.notifyScheduleUpdate();
        return result;
    }
    async approve(id, userProgramIds, userRole) {
        const request = await this.prisma.slotRequest.findUnique({
            where: { id },
            include: { room: { include: { assignments: true } } },
        });
        if (!request)
            throw new common_1.BadRequestException("Talep bulunamadı.");
        if (request.status !== "PENDING")
            throw new common_1.BadRequestException("Bu talep artık beklemede değil.");
        const ownerProgramIds = request.room.assignments.map((a) => a.programId);
        const myOwnerProgramIds = ownerProgramIds.filter((pid) => userProgramIds.includes(pid));
        if (myOwnerProgramIds.length === 0 && userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException("Bu talep için onay verme yetkiniz yok.");
        }
        const programsToApprove = userRole === 'ADMIN' ? ownerProgramIds : myOwnerProgramIds;
        await this.prisma.$transaction(async (tx) => {
            for (const programId of programsToApprove) {
                await tx.slotRequestApproval.upsert({
                    where: { slotRequestId_programId: { slotRequestId: id, programId } },
                    create: { slotRequestId: id, programId, approved: true },
                    update: { approved: true },
                });
            }
            const allApprovals = await tx.slotRequestApproval.findMany({ where: { slotRequestId: id } });
            const approvedSet = new Set(allApprovals.filter((a) => a.approved).map((a) => a.programId));
            const allApproved = ownerProgramIds.every((pid) => approvedSet.has(pid));
            if (allApproved) {
                await tx.slotRequest.update({ where: { id }, data: { status: "APPROVED" } });
                await tx.slotRequest.updateMany({
                    where: {
                        id: { not: id },
                        roomId: request.roomId,
                        date: request.date,
                        time: request.time,
                        status: "PENDING"
                    },
                    data: { status: "REJECTED" }
                });
            }
        });
        this.gateway.notifyScheduleUpdate();
        return { success: true };
    }
    async reject(id, userProgramIds, userRole) {
        const request = await this.prisma.slotRequest.findUnique({
            where: { id },
            include: { room: { include: { assignments: true } } },
        });
        if (!request)
            throw new common_1.BadRequestException("Talep bulunamadı.");
        if (request.status !== "PENDING")
            throw new common_1.BadRequestException("Bu talep artık beklemede değil.");
        const ownerProgramIds = request.room.assignments.map((a) => a.programId);
        const myOwnerProgramIds = ownerProgramIds.filter((pid) => userProgramIds.includes(pid));
        if (myOwnerProgramIds.length === 0 && userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException("Bu talep için red verme yetkiniz yok.");
        }
        const programsToReject = userRole === 'ADMIN' ? ownerProgramIds : myOwnerProgramIds;
        await this.prisma.$transaction(async (tx) => {
            for (const programId of programsToReject) {
                await tx.slotRequestApproval.upsert({
                    where: { slotRequestId_programId: { slotRequestId: id, programId } },
                    create: { slotRequestId: id, programId, approved: false },
                    update: { approved: false },
                });
            }
            await tx.slotRequest.update({ where: { id }, data: { status: "REJECTED" } });
        });
        this.gateway.notifyScheduleUpdate();
        return { success: true };
    }
    async withdraw(id, userProgramIds, userRole) {
        const request = await this.prisma.slotRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.BadRequestException("Talep bulunamadı.");
        if (!userProgramIds.includes(request.fromProgramId) && userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException("Bu talebi geri çekme yetkiniz yok.");
        }
        if (request.status !== "PENDING")
            throw new common_1.BadRequestException("Yalnızca beklemedeki talepler geri çekilebilir.");
        await this.prisma.slotRequest.update({
            where: { id },
            data: { status: "WITHDRAWN" },
        });
        this.gateway.notifyScheduleUpdate();
        return { success: true };
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        schedule_gateway_1.ScheduleGateway])
], RequestsService);
//# sourceMappingURL=requests.service.js.map