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
    user: {
      findUnique: jest.fn(),
    },
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
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
    mockPrisma.course.findUnique.mockResolvedValue({ id: 'c1', isSectioned: false, programId: 'p1' });
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
        .rejects.toThrow('Gözetmen "s1" bu saatte "Diğer Sınav" sınavında zaten gözetmen.');
    });

    it('aynı ders için mükerrer sınav oluşturulmaya çalışılırsa BadRequestException fırlatmalı', async () => {
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // 1. busyAsSup
        .mockResolvedValueOnce(null) // 2. busyAsInst
        .mockResolvedValueOnce({ id: 'existing-id' }); // 3. duplicateCourseExam
      await expect(service.validateExam(null, validBody, user))
        .rejects.toThrow("Bu dersin bu saatte zaten bir sınavı var.");
    });

    it('hoca aynı saatte farklı bir dersin sınavında ise (aynı program) BadRequestException fırlatmalı', async () => {
      mockPrisma.instructor.findUnique.mockResolvedValueOnce({ id: 'i1', name: 'Hoca 1' });
      mockPrisma.course.findUnique.mockResolvedValueOnce({ id: 'c1', programId: 'p1', program: { name: 'P1' } }); // for currentCourse
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // 1. busyAsSup (Sup vs Sup)
        .mockResolvedValueOnce(null) // 2. busyAsInst (Sup vs Inst)
        .mockResolvedValueOnce(null) // 3. duplicateCourseExam
        .mockResolvedValueOnce(null) // 4. busyAsSup (Inst vs Sup)
        .mockResolvedValueOnce({ 
          course: { name: 'Diğer Ders', programId: 'p1' }, 
          instructor: { name: 'Hoca 1' } 
        }); // 5. otherInstRole (same program)
      
      await expect(service.validateExam(null, validBody, user))
        .rejects.toThrow('Hoca "Hoca 1" aynı programda ("P1") bu saatte zaten "Diğer Ders" sınavından sorumlu.');
    });

    it('hoca farklı programda ders sorumlusu ise İZİN VERMELİ', async () => {
      mockPrisma.instructor.findUnique.mockResolvedValueOnce({ id: 'i1', name: 'Hoca 1' });
      mockPrisma.course.findUnique.mockResolvedValueOnce({ id: 'c1', programId: 'p1' }); // for targetCourse
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // 1. busyAsSup
        .mockResolvedValueOnce(null) // 2. busyAsInst
        .mockResolvedValueOnce(null) // 3. duplicate
        .mockResolvedValueOnce(null) // 4. busyAsSup
        .mockResolvedValueOnce({ course: { name: 'Diğer Program Ders', programId: 'p2' } }) // 5. otherInstRole (diff program)
        .mockResolvedValueOnce(null); // 6. otherCourseInProgram

      await expect(service.validateExam(null, validBody, user))
        .resolves.not.toThrow();
    });

    it('sorumlu hoca başka sınavda gözetmen ise BadRequestException fırlatmalı', async () => {
      mockPrisma.instructor.findUnique.mockResolvedValueOnce({ name: 'Hoca 1' });
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // 1. busyAsSup (Sup vs Sup)
        .mockResolvedValueOnce(null) // 2. busyAsInst (Sup vs Inst)
        .mockResolvedValueOnce(null) // 3. duplicate
        .mockResolvedValueOnce({ 
          course: { name: 'Gözetmenlik Yaptığı Sınav' }
        }); // 4. busyAsSup (Inst vs Sup)
      
      await expect(service.validateExam(null, { ...validBody, instructorId: 'i1' }, user))
        .rejects.toThrow('Hoca "Hoca 1" bu saatte "Gözetmenlik Yaptığı Sınav" sınavında gözetmen olduğu için başka bir sınava atanamaz.');
    });

    it('salon çakışması durumunda BadRequestException fırlatmalı', async () => {
      mockPrisma.instructor.findUnique.mockResolvedValueOnce({ name: 'Hoca 1' });
      mockPrisma.course.findUnique.mockResolvedValueOnce({ id: 'c1' }); // targetCourse
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // 1. busyAsSup
        .mockResolvedValueOnce(null) // 2. busyAsInst
        .mockResolvedValueOnce(null) // 3. duplicate courseId
        .mockResolvedValueOnce(null) // 4. busyAsSup
        .mockResolvedValueOnce(null) // 5. otherInstRole
        .mockResolvedValueOnce(null) // 6. otherCourseInProgram
        .mockResolvedValueOnce({ course: { name: 'Dolu Sınav' } }); // 7. room overlap
      
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

    it('salon için bekleyen talep varsa BadRequestException fırlatmalı', async () => {
      mockPrisma.slotRequest.findFirst
        .mockResolvedValueOnce(null) // for APPROVED check
        .mockResolvedValueOnce({ 
          room: { name: 'Salon A' },
          status: 'PENDING'
        }); // for PENDING check
      await expect(service.validateExam(null, validBody, user))
        .rejects.toThrow('"Salon A" salonu için bekleyen bir rezervasyon talebi var. Lütfen önce bu talebi (onaylayarak veya reddederek) sonuçlandırın.');
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

    it('bölüm başkanı paylaşımlı programa sınav ekleyemez', async () => {
      mockPrisma.program.findUnique.mockResolvedValueOnce({ isSharedSource: true });
      await expect(service.validateExam(null, { programId: 'shared-p' }, user))
        .rejects.toThrow("Paylaşımlı (Genel) programa sınav ekleme yetkiniz yok.");
    });

    it('bölüm başkanı gözetmeni olan paylaşımlı sınavı düzenleyemez', async () => {
      mockPrisma.exam.findUnique.mockResolvedValueOnce({ 
        id: 'e1', isShared: true, programId: 'p1', supervisorIds: ['s1'], roomIds: ['r1'], createdBy: { role: 'ADMIN' } 
      });
      await expect(service.validateExam('e1', { supervisorIds: [] }, user))
        .rejects.toThrow("Paylaşımlı sınavlar sadece gözetmen atanmamışsa ve sadece gözetmen eklemek için düzenlenebilir.");
    });

    it('bölüm başkanı paylaşımlı sınavın tarihini değiştiremez', async () => {
      mockPrisma.exam.findUnique.mockResolvedValueOnce({ 
        id: 'e1', isShared: true, programId: 'p1', supervisorIds: [], roomIds: ['r1'], createdBy: { role: 'ADMIN' } 
      });
      await expect(service.validateExam('e1', { date: '02.01.2024' }, user))
        .rejects.toThrow("Paylaşımlı sınavlar sadece gözetmen atanmamışsa ve sadece gözetmen eklemek için düzenlenebilir.");
    });

    it('bölüm başkanı gözetmeni olmayan paylaşımlı sınava gözetmen atayabilir', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce({ id: 'c1', isSectioned: true });
      mockPrisma.exam.findUnique.mockResolvedValueOnce({ 
        id: 'e1', isShared: true, programId: 'p1', supervisorIds: [], roomIds: ['r1'], createdBy: { role: 'ADMIN' } 
      });
      // Should not throw
      await expect(service.validateExam('e1', { supervisorIds: ['s1'] }, user))
        .resolves.not.toThrow();
    });

    it('şubeli derste farklı şubelerin aynı anda sınavına izin vermeli', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 'c-sec-2', code: 'BIL-101' });
      mockPrisma.exam.findFirst.mockResolvedValue(null);
      
      // Should not throw even if another section of BIL-101 exists in session
      await expect(service.validateExam(null, { ...validBody, courseId: 'c-sec-2' }, user))
        .resolves.not.toThrow();
    });

    it('aynı programda farklı derslerin aynı anda sınavı engellenmeli', async () => {
      mockPrisma.instructor.findUnique.mockResolvedValueOnce({ name: 'H1' });
      mockPrisma.course.findUnique.mockResolvedValueOnce({ id: 'c-1', code: 'BIL-101', programId: 'p1' });
      mockPrisma.exam.findFirst
        .mockResolvedValueOnce(null) // 1. busyAsSup
        .mockResolvedValueOnce(null) // 2. busyAsInst
        .mockResolvedValueOnce(null) // 3. duplicate courseId
        .mockResolvedValueOnce(null) // 4. busyAsSup
        .mockResolvedValueOnce(null) // 5. otherInstRole
        .mockResolvedValueOnce({ course: { name: 'Diğer Ders', code: 'MAT-101' } }); // 6. same program exclusivity
      
      await expect(service.validateExam(null, { ...validBody, courseId: 'c-1' }, user))
        .rejects.toThrow('Aynı programda farklı derslerin ("Diğer Ders") sınavı aynı oturumda olamaz.');
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

    it('bölüm başkanı paylaşımlı sınavı silemez', async () => {
      mockPrisma.exam.findUnique.mockResolvedValueOnce({ id: 'e1', isShared: true, createdBy: { role: 'ADMIN' } });
      await expect(service.deleteExam('e1', user))
        .rejects.toThrow("Paylaşımlı sınav silinemez.");
    });
  });
});
