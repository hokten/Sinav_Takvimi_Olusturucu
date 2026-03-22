import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockRequireAuth, mockRequireAdmin } = vi.hoisted(() => {
  const mockPrisma = {
    slotRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
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

import { createSlotRequest, approveSlotRequest, rejectSlotRequest } from "@/app/actions/requests";

function deptHeadSession(programId = "prog-1") {
  return { user: { id: "dept-1", role: "DEPT_HEAD", programId } };
}

function adminSession() {
  return { user: { id: "admin-1", role: "ADMIN", programId: null } };
}

// ─── createSlotRequest ────────────────────────────────────────────────────────

describe("createSlotRequest", () => {
  const validData = { roomId: "room-1", date: "15.06.2025", time: "09:30" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.slotRequest.create.mockResolvedValue({ id: "req-1" });
  });

  it("bölüm başkanı yeni talep oluşturabilir", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.slotRequest.findFirst.mockResolvedValue(null);

    const result = await createSlotRequest(validData);
    expect(result.success).toBe(true);
    expect(mockPrisma.slotRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromProgramId: "prog-1",
          roomId: "room-1",
          date: "15.06.2025",
          time: "09:30",
        }),
      })
    );
  });

  it("admin talep oluşturamaz (sadece bölüm başkanı)", async () => {
    mockRequireAuth.mockResolvedValue(adminSession());

    await expect(createSlotRequest(validData)).rejects.toThrow(
      "Yalnızca bölüm başkanları talep oluşturabilir."
    );
  });

  it("programId olmayan kullanıcı talep oluşturamaz", async () => {
    mockRequireAuth.mockResolvedValue({
      user: { id: "dept-1", role: "DEPT_HEAD", programId: null },
    });

    await expect(createSlotRequest(validData)).rejects.toThrow("Program bilgisi bulunamadı.");
  });

  it("aynı slot için tekrar talep oluşturulamaz", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));
    mockPrisma.slotRequest.findFirst.mockResolvedValue({ id: "req-existing" });

    await expect(createSlotRequest(validData)).rejects.toThrow(
      "Bu slot için zaten bir talebiniz mevcut."
    );
  });

  it("geçersiz tarih formatında Zod hatası fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));

    await expect(createSlotRequest({ ...validData, date: "2025-06-15" })).rejects.toThrow();
  });

  it("geçersiz saat formatında Zod hatası fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));

    await expect(createSlotRequest({ ...validData, time: "9:30" })).rejects.toThrow();
  });

  it("boş roomId ile Zod hatası fırlatır", async () => {
    mockRequireAuth.mockResolvedValue(deptHeadSession("prog-1"));

    await expect(createSlotRequest({ ...validData, roomId: "" })).rejects.toThrow(
      "Derslik seçiniz."
    );
  });
});

// ─── approveSlotRequest ───────────────────────────────────────────────────────

describe("approveSlotRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.slotRequest.update.mockResolvedValue({ id: "req-1", status: "APPROVED" });
  });

  it("admin talebi onaylayabilir", async () => {
    mockRequireAdmin.mockResolvedValue(adminSession());

    const result = await approveSlotRequest("req-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.slotRequest.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "APPROVED" },
    });
  });

  it("admin yetkisi olmadan hata fırlatır", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Bu işlem için admin yetkisi gerekiyor."));

    await expect(approveSlotRequest("req-1")).rejects.toThrow(
      "Bu işlem için admin yetkisi gerekiyor."
    );
    expect(mockPrisma.slotRequest.update).not.toHaveBeenCalled();
  });
});

// ─── rejectSlotRequest ────────────────────────────────────────────────────────

describe("rejectSlotRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.slotRequest.update.mockResolvedValue({ id: "req-1", status: "REJECTED" });
  });

  it("admin talebi reddedebilir", async () => {
    mockRequireAdmin.mockResolvedValue(adminSession());

    const result = await rejectSlotRequest("req-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.slotRequest.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "REJECTED" },
    });
  });

  it("admin yetkisi olmadan hata fırlatır", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Bu işlem için admin yetkisi gerekiyor."));

    await expect(rejectSlotRequest("req-1")).rejects.toThrow(
      "Bu işlem için admin yetkisi gerekiyor."
    );
    expect(mockPrisma.slotRequest.update).not.toHaveBeenCalled();
  });
});
