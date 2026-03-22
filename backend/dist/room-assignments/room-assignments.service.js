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
exports.RoomAssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_gateway_1 = require("../schedule/schedule.gateway");
let RoomAssignmentsService = class RoomAssignmentsService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async findAll() {
        return this.prisma.roomAssignment.findMany();
    }
    async toggle(roomId, programId) {
        const existing = await this.prisma.roomAssignment.findUnique({
            where: { roomId_programId: { roomId, programId } },
        });
        let result;
        if (existing) {
            await this.prisma.roomAssignment.delete({
                where: { id: existing.id },
            });
            result = { action: 'removed' };
        }
        else {
            const assignment = await this.prisma.roomAssignment.create({
                data: { roomId, programId },
            });
            result = { action: 'added', assignment };
        }
        this.gateway.notifyScheduleUpdate();
        return result;
    }
};
exports.RoomAssignmentsService = RoomAssignmentsService;
exports.RoomAssignmentsService = RoomAssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        schedule_gateway_1.ScheduleGateway])
], RoomAssignmentsService);
//# sourceMappingURL=room-assignments.service.js.map