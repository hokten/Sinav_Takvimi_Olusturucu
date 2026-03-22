import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from './schedule.gateway';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: PrismaService;
  let gateway: ScheduleGateway;

  const mockPrisma = {
    exam: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    program: {
      findUnique: jest.fn(),
    },
    instructor: {
      findUnique: jest.fn(),
    },
    slotRequest: {
      findFirst: jest.fn(),
    },
  };

  const mockGateway = {
    notifyScheduleUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ScheduleGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<ScheduleGateway>(ScheduleGateway);

    // Default mocks
    mockPrisma.exam.findFirst.mockResolvedValue(null);
    mockPrisma.exam.findUnique.mockResolvedValue(null);
    mockPrisma.slotRequest.findFirst.mockResolvedValue(null);
    mockPrisma.instructor.findUnique.mockResolvedValue(null);
    mockPrisma.program.findUnique.mockResolvedValue({ id: 'p1', isSharedSource: false });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateExam', () => {
    const user = { id: 'u1', role: 'DEPT_HEAD', programIds: ['p1'] };
    const validBody = {
      courseId: 'c1',
      date: '01.01.2024',
      time: '10:00',
      roomIds: ['r1'],
      supervisorIds: ['s1'],
      instructorId: 'i1',
      programId: 'p1',
    };

    it('oda seçilmediyse BadRequestException fırlatmalı', async () => {
      await expect(service.validateExam(null, { ...validBody, roomIds: [] }, user))
        .rejects.toThrow(BadRequestException);
    });

    it('gözetmen sayısı oda sayısına eşit değilse BadRequestException fırlatmalı', async () => {
      await expect(service.validateExam(null, { ...validBody, supervisorIds: ['s1', 's2'] }, user))
        .rejects.toThrow("Atanan gözetmen sayısı, seçilen derslik sayısına eşit olmalıdır");
    });

    it('gözetmen çakışması durumunda BadRequestException fırlatmalı', async () => {
      mockPrisma.exam.findFirst.mockResolvedValueOnce({ 
        course: { name: 'Diğer Sınav' },
        supervisorIds: ['s1'] 
      });
      await expect(service.validateExam(null, validBody, user))
        .rejects.toThrow('Gözetmen "s1" bu saatte "Diğer Sınav" sınavında görevli.');
    });

    it('aynı ders için mükerrer sınav oluşturulmaya çalışılırsa BadRequestException fırlatmalı', async () => {
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // supervisor
        .mockResolvedValueOnce({ id: 'e-old' }); // duplicate course
      await expect(service.validateExam(null, validBody, user))
        .rejects.toThrow("Bu dersin bu saatte zaten bir sınavı var.");
    });

    it('hoca aynı saatte farklı bir dersin sınavında ise BadRequestException fırlatmalı', async () => {
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // supervisor
        .mockResolvedValueOnce(null) // duplicate course
        .mockResolvedValueOnce({ course: { name: 'Diğer Ders' } }); // instructor conflict
      await expect(service.validateExam(null, validBody, user))
        .rejects.toThrow('Sorumlu hoca bu saatte zaten "Diğer Ders" sınavından sorumlu.');
    });

    it('sorumlu hoca başka sınavda gözetmen ise BadRequestException fırlatmalı', async () => {
      mockPrisma.instructor.findUnique.mockResolvedValueOnce({ name: 'Hoca 1' });
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // supervisor
        .mockResolvedValueOnce(null) // duplicate
        .mockResolvedValueOnce(null) // instructor conflict
        .mockResolvedValueOnce({ 
          course: { name: 'Gözetmenlik Yaptığı Sınav' },
          supervisorIds: ['Hoca 1']
        }); // instructor busy as supervisor
      
      await expect(service.validateExam(null, { ...validBody, instructorId: 'i1' }, user))
        .rejects.toThrow('Sorumlu hoca "Hoca 1" bu saatte "Gözetmenlik Yaptığı Sınav" sınavında gözetmen olarak görevli.');
    });

    it('salon çakışması durumunda BadRequestException fırlatmalı', async () => {
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // supervisor
        .mockResolvedValueOnce(null) // duplicate
        .mockResolvedValueOnce(null) // inst conflict
        .mockResolvedValueOnce({ course: { name: 'Dolu Sınav' } }); // room overlap
      
      await expect(service.validateExam(null, validBody, user))
        .rejects.toThrow('Seçilen salonlardan biri bu saatte "Dolu Sınav" sınavı/dersliği için dolu.');
    });

    it('salon rezerve edilmişse BadRequestException fırlatmalı', async () => {
      mockPrisma.slotRequest.findFirst.mockResolvedValueOnce({ 
        fromProgram: { name: 'Diğer Program' }
      });
      await expect(service.validateExam(null, validBody, user))
        .rejects.toThrow('Seçilen salon bu saatte "Diğer Program" programına rezerve edilmiş.');
    });

    it('yetkisiz kullanıcı düzenlemeye çalışırsa ForbiddenException fırlatmalı', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({ 
        programId: 'p2', 
        isShared: false,
        createdBy: { role: 'DEPT_HEAD' }
      });
      await expect(service.validateExam('e1', {}, user))
        .rejects.toThrow("Bu program için sınav yönetme yetkiniz yok.");
    });
  });

  describe('createExam', () => {
    const user = { id: 'u1', role: 'DEPT_HEAD', programIds: ['p1'] };
    const body = { programId: 'p1', roomIds: ['r1'], supervisorIds: ['s1'], courseId: 'c1', date: '01.01.2024', time: '10:00' };

    it('başarıyla sınav oluşturmalı', async () => {
      mockPrisma.exam.create.mockResolvedValue({ id: 'new-exam' });
      const result = await service.createExam(body, user);
      expect(result).toEqual({ id: 'new-exam' });
      expect(gateway.notifyScheduleUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteExam', () => {
    const user = { id: 'u1', role: 'DEPT_HEAD', programIds: ['p1'] };

    it('başarıyla sınav silmeli', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({ 
        id: 'e1',
        programId: 'p1', 
        isShared: false,
        createdBy: { role: 'DEPT_HEAD' }
      });
      mockPrisma.exam.delete.mockResolvedValue({ id: 'e1' });

      const result = await service.deleteExam('e1', user);
      expect(result).toEqual({ success: true });
      expect(gateway.notifyScheduleUpdate).toHaveBeenCalled();
    });
  });
});
