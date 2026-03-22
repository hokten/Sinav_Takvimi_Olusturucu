import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ScheduleGateway } from '../schedule/schedule.gateway';

describe('RequestsService', () => {
  let service: RequestsService;
  let prisma: PrismaService;
  let gateway: ScheduleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
            slotRequest: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
            room: { findUnique: jest.fn() },
            slotRequestApproval: { upsert: jest.fn(), findMany: jest.fn() }
          }
        },
        {
          provide: ScheduleGateway,
          useValue: { notifyScheduleUpdate: jest.fn() }
        }
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<ScheduleGateway>(ScheduleGateway);
  });

  describe('create', () => {
    it('kullanıcı ADMIN veya DEPT_HEAD değilse ForbiddenException fırlatmalı', async () => {
      await expect(service.create({ programId: 'p1', roomId: 'r1', date: 'd', time: 't' }, 'USER', ['p1']))
        .rejects.toThrow(ForbiddenException);
    });

    it('DEPT_HEAD için programId, userProgramIds listesinde yoksa ForbiddenException fırlatmalı', async () => {
      await expect(service.create({ programId: 'p1', roomId: 'r1', date: 'd', time: 't' }, 'DEPT_HEAD', ['p2']))
        .rejects.toThrow(ForbiddenException);
    });

    it('zaten aktif bir talep varsa BadRequestException fırlatmalı', async () => {
      jest.spyOn(prisma.room, 'findUnique').mockResolvedValue({ assignments: [] } as any);
      jest.spyOn(prisma.slotRequest, 'findFirst').mockResolvedValueOnce(null); // approved check
      jest.spyOn(prisma.slotRequest, 'findFirst').mockResolvedValueOnce({ id: 'existing' } as any); // existing check
      await expect(service.create({ programId: 'p1', roomId: 'r1', date: 'd', time: 't' }, 'DEPT_HEAD', ['p1']))
        .rejects.toThrow(BadRequestException);
    });

    it('kendi salonuna istekte bulunmaya çalışırsa BadRequestException fırlatmalı', async () => {
      jest.spyOn(prisma.room, 'findUnique').mockResolvedValue({ assignments: [{ programId: 'p1' }] } as any);
      await expect(service.create({ programId: 'p1', roomId: 'r1', date: 'd', time: 't' }, 'DEPT_HEAD', ['p1']))
        .rejects.toThrow("Bu salon zaten programınıza atanmış durumda");
    });

    it('slot halihazırda başka programa onaylanmışsa (APPROVED) BadRequestException fırlatmalı', async () => {
      jest.spyOn(prisma.room, 'findUnique').mockResolvedValue({ assignments: [] } as any);
      // First call is approvedSlot check
      jest.spyOn(prisma.slotRequest, 'findFirst').mockResolvedValueOnce({ id: 'approved-slot', status: 'APPROVED' } as any);
      await expect(service.create({ programId: 'p2', roomId: 'r1', date: 'd', time: 't' }, 'DEPT_HEAD', ['p2']))
        .rejects.toThrow("Bu slot halihazırda onaylanmış ve başka bir program tarafından rezerve edilmiştir.");
    });

    it('doğrulamadan geçerse talebi başarıyla oluşturmalı', async () => {
      jest.spyOn(prisma.room, 'findUnique').mockResolvedValue({ assignments: [] } as any);
      jest.spyOn(prisma.slotRequest, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.slotRequest, 'create').mockResolvedValue({ id: 'new_req' } as any);

      const res = await service.create({ programId: 'p1', roomId: 'r1', date: 'd', time: 't' }, 'DEPT_HEAD', ['p1']);
      expect(res).toEqual({ id: 'new_req' });
      expect(prisma.slotRequest.create).toHaveBeenCalled();
      expect(gateway.notifyScheduleUpdate).toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('talep PENDING (beklemede) durumunda değilse BadRequestException fırlatmalı', async () => {
      jest.spyOn(prisma.slotRequest, 'findUnique').mockResolvedValue({ id: 'r1', status: 'APPROVED', room: { assignments: [] } } as any);
      await expect(service.approve('r1', ['p1'], 'DEPT_HEAD')).rejects.toThrow(BadRequestException);
    });

    it('tüm sahipler onay verirse işlemi (transaction) gerçekleştirip durumu APPROVED yapmalı ve çakışan diğer PENDING istekleri REJECTED yapmalı', async () => {
      jest.spyOn(prisma.slotRequest, 'findUnique').mockResolvedValue({ 
        id: 'r1', 
        roomId: 'room-1',
        date: 'd',
        time: 't',
        status: 'PENDING', 
        room: { assignments: [{ programId: 'p1' }] } 
      } as any);
      
      jest.spyOn(prisma.slotRequestApproval, 'findMany').mockResolvedValue([{ programId: 'p1', approved: true }] as any);
      jest.spyOn(prisma.slotRequest, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.slotRequest, 'updateMany').mockResolvedValue({ count: 1 } as any);

      const res = await service.approve('r1', ['p1'], 'DEPT_HEAD');

      expect(prisma.slotRequestApproval.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: { slotRequestId: 'r1', programId: 'p1', approved: true }
      }));
      expect(prisma.slotRequest.update).toHaveBeenCalledWith({ where: { id: 'r1' }, data: { status: 'APPROVED' } });
      expect(prisma.slotRequest.updateMany).toHaveBeenCalledWith({
        where: { id: { not: 'r1' }, roomId: 'room-1', date: 'd', time: 't', status: 'PENDING' },
        data: { status: 'REJECTED' }
      });
      expect(gateway.notifyScheduleUpdate).toHaveBeenCalled();
      expect(res).toEqual({ success: true });
    });
  });
});
