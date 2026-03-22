import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleController } from './schedule.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from './schedule.gateway';
import { ScheduleService } from './schedule.service';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  let prisma: PrismaService;
  let gateway: ScheduleGateway;
  let service: ScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            program: { findUnique: jest.fn() },
            exam: { 
              findFirst: jest.fn(), 
              create: jest.fn(), 
              findUnique: jest.fn(), 
              update: jest.fn(), 
              delete: jest.fn() 
            },
            slotRequest: { findFirst: jest.fn() },
            scheduleDay: { findMany: jest.fn() },
            room: { findMany: jest.fn() },
            instructor: { findMany: jest.fn() },
            course: { findMany: jest.fn() },
            roomAssignment: { findMany: jest.fn() },
          }
        },
        {
          provide: ScheduleGateway,
          useValue: { notifyScheduleUpdate: jest.fn() }
        },
        {
          provide: ScheduleService,
          useValue: {
            createExam: jest.fn(),
            updateExam: jest.fn(),
            deleteExam: jest.fn(),
          }
        }
      ],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<ScheduleGateway>(ScheduleGateway);
    service = module.get<ScheduleService>(ScheduleService);
  });

  describe('checkSupervisorConflict', () => {
    it('çatışma varsa true dönmeli', async () => {
      jest.spyOn(prisma.exam, 'findFirst').mockResolvedValue({ course: { name: 'Mat 101' } } as any);
      
      const result = await controller.checkSupervisorConflict('Ahmet Yılmaz', '2026-06-01', '10:00');
      
      expect(result.conflict).toBe(true);
      expect(result.message).toContain('Mat 101');
    });

    it('çatışma yoksa false dönmeli', async () => {
      jest.spyOn(prisma.exam, 'findFirst').mockResolvedValue(null);
      
      const result = await controller.checkSupervisorConflict('Ahmet Yılmaz', '2026-06-01', '10:00');
      
      expect(result.conflict).toBe(false);
    });
  });

  describe('createExam', () => {
    it('sınavı oluşturmalı ve service i çağırmalı', async () => {
      const mockExam = { id: 'e1' };
      jest.spyOn(service, 'createExam').mockResolvedValue(mockExam as any);

      const req = { user: { id: 'user1' } };
      const body = { programId: 'p1', courseId: 'c1', date: '2026-06-01', time: '10:00', roomIds: ['r1'] };

      const result = await controller.createExam(body, req);

      expect(service.createExam).toHaveBeenCalledWith(body, req.user);
      expect(result).toEqual(mockExam);
    });
  });

  describe('updateExam', () => {
    it('sınavı güncellemeli ve service i çağırmalı', async () => {
      const mockExam = { id: 'e1' };
      jest.spyOn(service, 'updateExam').mockResolvedValue(mockExam as any);

      const req = { user: { id: 'user1' } };
      const body = { date: '2026-06-02' };

      const result = await controller.updateExam('e1', body, req);

      expect(service.updateExam).toHaveBeenCalledWith('e1', body, req.user);
      expect(result).toEqual(mockExam);
    });
  });

  describe('deleteExam', () => {
    it('sınavı silmeli ve service i çağırmalı', async () => {
      jest.spyOn(service, 'deleteExam').mockResolvedValue({ success: true } as any);

      const req = { user: { id: 'user1' } };

      const result = await controller.deleteExam('e1', req);

      expect(service.deleteExam).toHaveBeenCalledWith('e1', req.user);
      expect(result).toEqual({ success: true });
    });
  });
});
