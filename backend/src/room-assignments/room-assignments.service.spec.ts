import { Test, TestingModule } from '@nestjs/testing';
import { RoomAssignmentsService } from './room-assignments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';

describe('RoomAssignmentsService', () => {
  let service: RoomAssignmentsService;
  let prisma: PrismaService;
  let gateway: ScheduleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomAssignmentsService,
        {
          provide: PrismaService,
          useValue: {
            roomAssignment: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn()
            }
          }
        },
        {
          provide: ScheduleGateway,
          useValue: { notifyScheduleUpdate: jest.fn() }
        }
      ],
    }).compile();

    service = module.get<RoomAssignmentsService>(RoomAssignmentsService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<ScheduleGateway>(ScheduleGateway);
  });

  describe('findAll', () => {
    it('tüm atamaları döner', async () => {
      const mockAssignments = [{ id: 'ra-1', roomId: 'r1', programId: 'p1' }];
      jest.spyOn(prisma.roomAssignment, 'findMany').mockResolvedValue(mockAssignments as any);

      const result = await service.findAll();
      expect(result).toEqual(mockAssignments);
      expect(prisma.roomAssignment.findMany).toHaveBeenCalled();
    });

    it('atama yoksa boş dizi döner', async () => {
      jest.spyOn(prisma.roomAssignment, 'findMany').mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('toggle', () => {
    it('atama yoksa yeni atama oluşturur', async () => {
      jest.spyOn(prisma.roomAssignment, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.roomAssignment, 'create').mockResolvedValue({ id: 'ra-new', roomId: 'r1', programId: 'p1' } as any);

      const result = await service.toggle('r1', 'p1');
      expect(result.action).toBe('added');
      expect(prisma.roomAssignment.create).toHaveBeenCalledWith({ data: { roomId: 'r1', programId: 'p1' } });
      expect(gateway.notifyScheduleUpdate).toHaveBeenCalled();
      expect(prisma.roomAssignment.delete).not.toHaveBeenCalled();
    });

    it('atama varsa mevcut atamayı siler', async () => {
      jest.spyOn(prisma.roomAssignment, 'findUnique').mockResolvedValue({ id: 'ra-old', roomId: 'r1', programId: 'p1' } as any);
      jest.spyOn(prisma.roomAssignment, 'delete').mockResolvedValue({} as any);

      const result = await service.toggle('r1', 'p1');
      expect(result.action).toBe('removed');
      expect(prisma.roomAssignment.delete).toHaveBeenCalledWith({ where: { id: 'ra-old' } });
      expect(gateway.notifyScheduleUpdate).toHaveBeenCalled();
      expect(prisma.roomAssignment.create).not.toHaveBeenCalled();
    });
  });
});
