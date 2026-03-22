import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock tanımları (vi.mock hoist'tan önce vi.hoisted ile) ──────────────────
const { mockPrisma, mockRequireAuth, mockRequireAdmin } = vi.hoisted(() => {
  const mockPrisma = {
    program: { findUnique: vi.fn() },
    course: { findUnique: vi.fn() },
    room: { findUnique: vi.fn() },
    roomAssignment: { findFirst: vi.fn() },
    exam: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sharedExamSupervisors: { upsert: vi.fn() },
    $transaction: vi.fn(),
  };
  return {
    mockPrisma,
    mockRequireAuth: vi.fn(),
    mockRequireAdmin: vi.fn(),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/permissions", () => ({
  requireAuth: mockRequireAuth,
  requireAdmin: mockRequireAdmin,
}));

import {
  createExam,
  deleteExam,
  updateExam,
  assignSupervisorsToAdminExam,
  updateSharedExamSupervisors,
} from "@/app/actions/exams";

// ─── Yardımcı session fabrikaları ─────────────────────────────────────────────

function adminSession(userId = "admin-1") {
  return { user: { id: userId, role: "ADMIN", programId: null } };
}

function deptHeadSession(programId = "prog-1", userId = "dept-1") {
  return { user: { id: userId, role: "DEPT_HEAD", programId } };
}

const validExamData = {
  courseId: "course-1",
  date: "15.06.2025",
  time: "09:30",
  roomIds: ["room-1"],
  supervisorIds: ["sup-1"],
  instructorId: "instructor-1",
  programId: "prog-1",
};

// ─── createExam ───────────────────────────────────────────────────────────────

describe("createExam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma)
    );
    mockPrisma.exam.findFirst.mockResolvedValue(null);
    mockPrisma.exam.create.mockResolvedValue({ id: "exam-new" });
    mockPrisma.room.findUnique.mockResolvedValue({ id: "room-1", name: "A-101" });
  });

  it("admin normal program için sınav oluşturabilir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-1", isSharedSource: false });

    const result = await createExam(validExamData);

    expect(result.success).toBe(true);
    expect(mockPrisma.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courseId: "course-1",
          date: "15.06.2025",
          time: "09:30",
          isShared: false,
          createdById: "admin-1",
        }),
      })
    );
  });

  it("admin paylaşımlı program için sınav oluşturabilir ve isShared=true olur", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-shared", isSharedSource: true });

    const result = await createExam({ ...validExamData, programId: "prog-shared" });

    expect(result.success).toBe(true);
    expect(mockPrisma.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isShared: true,
          supervisorIds: [], // paylaşımlı sınavda gözetmenler boş başlar
        }),
      })
    );
  });

  it("bölüm başkanı kendi programı için sınav oluşturabilir", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-1", isSharedSource: false });
    mockPrisma.course.findUnique.mockResolvedValue({ id: "course-1", adminOnly: false });
    mockPrisma.roomAssignment.findFirst.mockResolvedValue({ id: "ra-1" });

    const result = await createExam(validExamData);
    expect(result.success).toBe(true);
  });

  it("bölüm başkanı başka programın sınavını oluşturamaz", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-2")); // farklı program
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-1", isSharedSource: false });

    await expect(createExam(validExamData)).rejects.toThrow(
      "Bu program için sınav ekleyemezsiniz."
    );
  });

  it("bölüm başkanı paylaşımlı programa sınav ekleyemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-shared"));
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-shared", isSharedSource: true });

    await expect(
      createExam({ ...validExamData, programId: "prog-shared" })
    ).rejects.toThrow("Bu programa yalnızca yönetici sınav ekleyebilir.");
  });

  it("bölüm başkanı adminOnly derse sınav ekleyemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-1", isSharedSource: false });
    mockPrisma.course.findUnique.mockResolvedValue({ id: "course-1", adminOnly: true });

    await expect(createExam(validExamData)).rejects.toThrow(
      "Bu dersin sınavını yalnızca admin ekleyebilir."
    );
  });

  it("bölüm başkanı atanmamış salona sınav ekleyemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-1", isSharedSource: false });
    mockPrisma.course.findUnique.mockResolvedValue({ id: "course-1", adminOnly: false });
    mockPrisma.roomAssignment.findFirst.mockResolvedValue(null); // atanmamış

    await expect(createExam(validExamData)).rejects.toThrow(
      "Bu salona sınav ekleme yetkiniz yok."
    );
  });

  it("aynı salonda aynı tarih+saatte salon çakışması engellenir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-1", isSharedSource: false });
    mockPrisma.exam.findFirst.mockResolvedValueOnce({ id: "exam-existing" }); // çakışma

    await expect(createExam(validExamData)).rejects.toThrow(
      "salonunda bu saatte zaten bir sınav var."
    );
  });

  it("aynı hocanın aynı tarih+saatte hoca çakışması engellenir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.program.findUnique.mockResolvedValue({ id: "prog-1", isSharedSource: false });
    mockPrisma.exam.findFirst
      .mockResolvedValueOnce(null)            // salon çakışması yok
      .mockResolvedValueOnce({ id: "exam-other" }); // hoca çakışması var

    await expect(createExam(validExamData)).rejects.toThrow(
      "Bu hocanın bu tarih ve saatte başka bir sınavı var."
    );
  });

  it("geçersiz tarih formatında Zod hatası fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());

    await expect(
      createExam({ ...validExamData, date: "2025-06-15" })
    ).rejects.toThrow("tarih");
  });

  it("boş roomIds ile Zod hatası fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());

    await expect(
      createExam({ ...validExamData, roomIds: [] })
    ).rejects.toThrow("derslik");
  });
});

// ─── deleteExam ───────────────────────────────────────────────────────────────

describe("deleteExam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma)
    );
    mockPrisma.exam.delete.mockResolvedValue({});
  });

  it("admin herhangi bir sınavı silebilir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      course: { adminOnly: false },
      createdBy: { role: "DEPT_HEAD" },
    });

    const result = await deleteExam("exam-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.exam.delete).toHaveBeenCalledWith({ where: { id: "exam-1" } });
  });

  it("bölüm başkanı kendi programının sınavını silebilir", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      course: { adminOnly: false },
      createdBy: { role: "DEPT_HEAD" },
    });

    const result = await deleteExam("exam-1");
    expect(result.success).toBe(true);
  });

  it("bulunamayan sınav için hata fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue(null);

    await expect(deleteExam("nonexistent")).rejects.toThrow("Sınav bulunamadı.");
  });

  it("bölüm başkanı paylaşımlı sınavı silemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: true,
      course: { adminOnly: false },
      createdBy: { role: "ADMIN" },
    });

    await expect(deleteExam("exam-1")).rejects.toThrow(
      "Paylaşımlı sınavı yalnızca yönetici silebilir."
    );
  });

  it("bölüm başkanı admin tarafından oluşturulan sınavı silemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      course: { adminOnly: false },
      createdBy: { role: "ADMIN" },
    });

    await expect(deleteExam("exam-1")).rejects.toThrow(
      "Bu sınav yalnızca yönetici tarafından silinebilir."
    );
  });

  it("bölüm başkanı başka programın sınavını silemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-2"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1", // farklı program
      isShared: false,
      course: { adminOnly: false },
      createdBy: { role: "DEPT_HEAD" },
    });

    await expect(deleteExam("exam-1")).rejects.toThrow("Bu sınavı silme yetkiniz yok.");
  });

  it("bölüm başkanı adminOnly derse ait sınavı silemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      course: { adminOnly: true },
      createdBy: { role: "DEPT_HEAD" },
    });

    await expect(deleteExam("exam-1")).rejects.toThrow(
      "Bu dersin sınavını yalnızca admin silebilir."
    );
  });
});

// ─── updateExam ───────────────────────────────────────────────────────────────

describe("updateExam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma)
    );
    mockPrisma.exam.update.mockResolvedValue({});
    mockPrisma.exam.findFirst.mockResolvedValue(null);
    mockPrisma.room.findUnique.mockResolvedValue({ id: "room-1", name: "A-101" });
  });

  it("admin var olan sınavı güncelleyebilir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      supervisorIds: ["sup-1"],
      course: { adminOnly: false },
      createdBy: { role: "ADMIN" },
    });

    const result = await updateExam("exam-1", validExamData);
    expect(result.success).toBe(true);
  });

  it("bölüm başkanı kendi programının sınavını güncelleyebilir", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      supervisorIds: [],
      course: { adminOnly: false },
      createdBy: { role: "DEPT_HEAD" },
    });

    const result = await updateExam("exam-1", validExamData);
    expect(result.success).toBe(true);
  });

  it("bölüm başkanı paylaşımlı sınavı güncelleyemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: true,
      supervisorIds: [],
      course: { adminOnly: false },
      createdBy: { role: "ADMIN" },
    });

    await expect(updateExam("exam-1", validExamData)).rejects.toThrow(
      "Paylaşımlı sınavı yalnızca yönetici düzenleyebilir."
    );
  });

  it("bölüm başkanı admin tarafından oluşturulan sınavı güncelleyemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      supervisorIds: [],
      course: { adminOnly: false },
      createdBy: { role: "ADMIN" },
    });

    await expect(updateExam("exam-1", validExamData)).rejects.toThrow(
      "Bu sınav yalnızca yönetici tarafından düzenlenebilir."
    );
  });

  it("güncelleme sırasında salon çakışması (başka sınavla) engellenir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      supervisorIds: [],
      course: { adminOnly: false },
      createdBy: { role: "ADMIN" },
    });
    mockPrisma.exam.findFirst.mockResolvedValueOnce({ id: "exam-conflict" });

    await expect(updateExam("exam-1", validExamData)).rejects.toThrow(
      "salonunda bu saatte zaten bir sınav var."
    );
  });

  it("güncelleme sırasında hoca çakışması engellenir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      supervisorIds: [],
      course: { adminOnly: false },
      createdBy: { role: "ADMIN" },
    });
    mockPrisma.exam.findFirst
      .mockResolvedValueOnce(null)               // salon çakışması yok
      .mockResolvedValueOnce({ id: "exam-other" }); // hoca çakışması

    await expect(updateExam("exam-1", validExamData)).rejects.toThrow(
      "Bu hocanın bu saatte başka sınavı var."
    );
  });

  it("bulunamayan sınav için hata fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue(null);

    await expect(updateExam("nonexistent", validExamData)).rejects.toThrow("Sınav bulunamadı.");
  });
});

// ─── assignSupervisorsToAdminExam ─────────────────────────────────────────────

describe("assignSupervisorsToAdminExam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.exam.update.mockResolvedValue({});
  });

  it("admin gözetmen sayısından bağımsız atama yapabilir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      roomIds: ["room-1", "room-2"],
      supervisorIds: [],
      createdBy: { role: "ADMIN" },
    });

    const result = await assignSupervisorsToAdminExam("exam-1", ["sup-1"]);
    expect(result.success).toBe(true);
  });

  it("bölüm başkanı salon sayısıyla eşleşen gözetmen atayabilir", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      roomIds: ["room-1"],
      supervisorIds: [],
      createdBy: { role: "ADMIN" },
    });

    const result = await assignSupervisorsToAdminExam("exam-1", ["sup-1"]);
    expect(result.success).toBe(true);
  });

  it("bölüm başkanı salon sayısından farklı gözetmen atayamaz", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      roomIds: ["room-1", "room-2"], // 2 salon
      supervisorIds: [],
      createdBy: { role: "ADMIN" },
    });

    await expect(
      assignSupervisorsToAdminExam("exam-1", ["sup-1"]) // 1 gözetmen
    ).rejects.toThrow("2 salon için tam 2 gözetmen atanmalıdır");
  });

  it("bölüm başkanı admin tarafından gözetmen atanmış sınava tekrar atama yapamaz", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1",
      isShared: false,
      roomIds: ["room-1"],
      supervisorIds: ["existing-sup"], // zaten atanmış
      createdBy: { role: "ADMIN" },
    });

    await expect(
      assignSupervisorsToAdminExam("exam-1", ["sup-1"])
    ).rejects.toThrow("Bu sınavın gözetmenleri yönetici tarafından belirlenmiştir.");
  });

  it("paylaşımlı sınav için kullanılamaz", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      isShared: true,
      createdBy: { role: "ADMIN" },
    });

    await expect(
      assignSupervisorsToAdminExam("exam-1", ["sup-1"])
    ).rejects.toThrow("Paylaşımlı sınavlar için bu işlem kullanılamaz.");
  });

  it("admin tarafından oluşturulmamış sınav için kullanılamaz", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      isShared: false,
      supervisorIds: [],
      createdBy: { role: "DEPT_HEAD" },
    });

    await expect(
      assignSupervisorsToAdminExam("exam-1", ["sup-1"])
    ).rejects.toThrow("Bu sınav admin tarafından oluşturulmamış.");
  });

  it("bölüm başkanı başka programın sınavına gözetmen atayamaz", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-2"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      programId: "prog-1", // farklı program
      isShared: false,
      roomIds: ["room-1"],
      supervisorIds: [],
      createdBy: { role: "ADMIN" },
    });

    await expect(
      assignSupervisorsToAdminExam("exam-1", ["sup-1"])
    ).rejects.toThrow("Bu sınav için gözetmen atama yetkiniz yok.");
  });
});

// ─── updateSharedExamSupervisors ──────────────────────────────────────────────

describe("updateSharedExamSupervisors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.sharedExamSupervisors.upsert.mockResolvedValue({});
  });

  it("admin herhangi bir program için paylaşımlı sınav gözetmeni güncelleyebilir", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      isShared: true,
      roomIds: ["room-1"],
    });

    const result = await updateSharedExamSupervisors("exam-1", "prog-1", ["sup-1"]);
    expect(result.success).toBe(true);
    expect(mockPrisma.sharedExamSupervisors.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { examId_programId: { examId: "exam-1", programId: "prog-1" } },
        create: expect.objectContaining({ supervisorIds: ["sup-1"] }),
        update: expect.objectContaining({ supervisorIds: ["sup-1"] }),
      })
    );
  });

  it("bölüm başkanı kendi programı için doğru sayıda gözetmen atayabilir", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      isShared: true,
      roomIds: ["room-1"],
    });

    const result = await updateSharedExamSupervisors("exam-1", "prog-1", ["sup-1"]);
    expect(result.success).toBe(true);
  });

  it("bölüm başkanı başka programın gözetmenlerini güncelleyemez", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-2"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      isShared: true,
      roomIds: ["room-1"],
    });

    await expect(
      updateSharedExamSupervisors("exam-1", "prog-1", ["sup-1"])
    ).rejects.toThrow("Bu program için gözetmen atama yetkiniz yok.");
  });

  it("bölüm başkanı salon sayısından farklı gözetmen atayamaz", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      isShared: true,
      roomIds: ["room-1", "room-2"], // 2 salon
    });

    await expect(
      updateSharedExamSupervisors("exam-1", "prog-1", ["sup-1"])
    ).rejects.toThrow("2 salon için tam 2 gözetmen atanmalıdır");
  });

  it("paylaşımlı olmayan sınav için hata fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue({
      id: "exam-1",
      isShared: false,
    });

    await expect(
      updateSharedExamSupervisors("exam-1", "prog-1", ["sup-1"])
    ).rejects.toThrow("Bu sınav paylaşımlı değil.");
  });

  it("bulunamayan sınav için hata fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());
    mockPrisma.exam.findUnique.mockResolvedValue(null);

    await expect(
      updateSharedExamSupervisors("nonexistent", "prog-1", ["sup-1"])
    ).rejects.toThrow("Sınav bulunamadı.");
  });
});
