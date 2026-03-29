import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private gateway: ScheduleGateway,
  ) {}

  async findAll(userRole: string, userProgramIds: string[]) {
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

  async create(data: { programId: string, roomId: string, date: string, time: string }, userRole: string, userProgramIds: string[]) {
    if (userRole !== 'DEPT_HEAD' && userRole !== 'ADMIN') throw new ForbiddenException("Yetkiniz yok.");
    if (!data.programId || (!userProgramIds.includes(data.programId) && userRole !== 'ADMIN')) {
      throw new ForbiddenException("Bu program için talep oluşturamazsınız.");
    }

    const room = await this.prisma.room.findUnique({
      where: { id: data.roomId },
      include: { assignments: true }
    });
    if (room && room.assignments.some(a => a.programId === data.programId)) {
      throw new BadRequestException("Bu salon zaten programınıza atanmış durumda, kendi salonunuz için talep oluşturamazsınız.");
    }

    // Check if an exam already exists in this slot
    const existingExam = await this.prisma.exam.findFirst({
      where: {
        roomIds: { has: data.roomId },
        date: data.date,
        time: data.time,
      },
    });
    if (existingExam) {
      throw new BadRequestException("Bu slotta halihazırda bir sınav planlanmıştır, talep oluşturamazsınız.");
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
      throw new BadRequestException("Bu slot halihazırda onaylanmış ve başka bir program tarafından rezerve edilmiştir.");
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
    if (existing) throw new BadRequestException("Bu slot için zaten aktif bir talebiniz mevcut.");

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

  async approve(id: string, userProgramIds: string[], userRole: string) {
    const request = await this.prisma.slotRequest.findUnique({
      where: { id },
      include: { room: { include: { assignments: true } } },
    });
    if (!request) throw new BadRequestException("Talep bulunamadı.");
    if (request.status !== "PENDING") throw new BadRequestException("Bu talep artık beklemede değil.");

    const ownerProgramIds = request.room.assignments.map((a) => a.programId);
    const myOwnerProgramIds = ownerProgramIds.filter((pid) => userProgramIds.includes(pid));

    if (myOwnerProgramIds.length === 0 && userRole !== 'ADMIN') {
      throw new ForbiddenException("Bu talep için onay verme yetkiniz yok.");
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

  async reject(id: string, userProgramIds: string[], userRole: string) {
    const request = await this.prisma.slotRequest.findUnique({
      where: { id },
      include: { room: { include: { assignments: true } } },
    });
    if (!request) throw new BadRequestException("Talep bulunamadı.");
    if (request.status !== "PENDING") throw new BadRequestException("Bu talep artık beklemede değil.");

    const ownerProgramIds = request.room.assignments.map((a) => a.programId);
    const myOwnerProgramIds = ownerProgramIds.filter((pid) => userProgramIds.includes(pid));

    if (myOwnerProgramIds.length === 0 && userRole !== 'ADMIN') {
      throw new ForbiddenException("Bu talep için red verme yetkiniz yok.");
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

  async withdraw(id: string, userProgramIds: string[], userRole: string) {
    const request = await this.prisma.slotRequest.findUnique({ where: { id } });
    if (!request) throw new BadRequestException("Talep bulunamadı.");
    if (!userProgramIds.includes(request.fromProgramId) && userRole !== 'ADMIN') {
      throw new ForbiddenException("Bu talebi geri çekme yetkiniz yok.");
    }
    if (request.status !== "PENDING") throw new BadRequestException("Yalnızca beklemedeki talepler geri çekilebilir.");

    await this.prisma.slotRequest.update({
      where: { id },
      data: { status: "WITHDRAWN" },
    });
    this.gateway.notifyScheduleUpdate();
    return { success: true };
  }
}
