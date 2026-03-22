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
exports.InstructorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InstructorsService = class InstructorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(user) {
        const isAdmin = user.role === 'ADMIN';
        const userProgramIds = user.programIds || [];
        const instructors = isAdmin
            ? await this.prisma.instructor.findMany({ include: { mainProgram: true } })
            : await this.prisma.instructor.findMany({
                where: {
                    OR: userProgramIds.flatMap((id) => [
                        { mainProgramId: id },
                        { sideProgramIds: { has: id } },
                    ]),
                },
                include: { mainProgram: true },
            });
        const programs = await this.prisma.program.findMany();
        const exams = await this.prisma.exam.findMany({
            include: { deptSupervisors: true },
        });
        const examCountMap = {};
        const supervisorCountMap = {};
        for (const exam of exams) {
            examCountMap[exam.instructorId] = (examCountMap[exam.instructorId] ?? 0) + 1;
            const allSupervisors = new Set([
                ...exam.supervisorIds,
                ...exam.deptSupervisors.flatMap((ds) => ds.supervisorIds),
            ]);
            for (const sid of allSupervisors) {
                supervisorCountMap[sid] = (supervisorCountMap[sid] ?? 0) + 1;
            }
        }
        const programMap = Object.fromEntries(programs.map((p) => [p.id, p]));
        return instructors.map((inst) => ({
            id: inst.id,
            name: inst.name,
            mainProgramName: inst.mainProgram.name,
            mainProgramColor: inst.mainProgram.color,
            sideProgramNames: inst.sideProgramIds.map((id) => programMap[id]?.name ?? ''),
            examCount: examCountMap[inst.id] ?? 0,
            supervisorCount: supervisorCountMap[inst.id] ?? 0,
        }));
    }
    async findAll() {
        return this.prisma.instructor.findMany({
            include: { mainProgram: true },
            orderBy: { name: 'asc' }
        });
    }
    async create(data) {
        return this.prisma.instructor.create({ data });
    }
    async update(id, data) {
        return this.prisma.instructor.update({ where: { id }, data });
    }
    async remove(id) {
        return this.prisma.instructor.delete({ where: { id } });
    }
};
exports.InstructorsService = InstructorsService;
exports.InstructorsService = InstructorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InstructorsService);
//# sourceMappingURL=instructors.service.js.map