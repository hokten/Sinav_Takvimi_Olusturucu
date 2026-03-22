import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockRequireAdmin } = vi.hoisted(() => {
  const mockPrisma = {
    roomAssignment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
  return {
    mockPrisma,
    mockRequireAdmin: vi.fn(),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/permissions", () => ({
  requireAuth: vi.fn(),
  requireAdmin: mockRequireAdmin,
}));

import { toggleRoomAssignment, getRoomAssignments } from "@/app/actions/roomAssignments";

function adminSession() {
  return { user: { id: "admin-1", role: "ADMIN", programId: null } };
}

// ─── toggleRoomAssignment ─────────────────────────────────────────────────────

describe("toggleRoomAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.roomAssignment.create.mockResolvedValue({ id: "ra-new" });
    mockPrisma.roomAssignment.delete.mockResolvedValue({});
  });

  it("atama yoksa yeni atama oluşturur", async () => {
    mockRequireAdmin.mockResolvedValue(adminSession());
    mockPrisma.roomAssignment.findFirst.mockResolvedValue(null);

    const result = await toggleRoomAssignment("room-1", "prog-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.roomAssignment.create).toHaveBeenCalledWith({
      data: { roomId: "room-1", programId: "prog-1" },
    });
    expect(mockPrisma.roomAssignment.delete).not.toHaveBeenCalled();
  });

  it("atama varsa mevcut atamayı siler", async () => {
    mockRequireAdmin.mockResolvedValue(adminSession());
    mockPrisma.roomAssignment.findFirst.mockResolvedValue({ id: "ra-1" });

    const result = await toggleRoomAssignment("room-1", "prog-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.roomAssignment.delete).toHaveBeenCalledWith({ where: { id: "ra-1" } });
    expect(mockPrisma.roomAssignment.create).not.toHaveBeenCalled();
  });

  it("admin yetkisi olmadan hata fırlatır", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Bu işlem için admin yetkisi gerekiyor."));

    await expect(toggleRoomAssignment("room-1", "prog-1")).rejects.toThrow(
      "Bu işlem için admin yetkisi gerekiyor."
    );
    expect(mockPrisma.roomAssignment.findFirst).not.toHaveBeenCalled();
  });

  it("aynı salon farklı programlara bağımsız olarak atanabilir", async () => {
    mockRequireAdmin.mockResolvedValue(adminSession());
    mockPrisma.roomAssignment.findFirst.mockResolvedValue(null);

    await toggleRoomAssignment("room-1", "prog-1");
    await toggleRoomAssignment("room-1", "prog-2");

    expect(mockPrisma.roomAssignment.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.roomAssignment.create).toHaveBeenCalledWith({
      data: { roomId: "room-1", programId: "prog-1" },
    });
    expect(mockPrisma.roomAssignment.create).toHaveBeenCalledWith({
      data: { roomId: "room-1", programId: "prog-2" },
    });
  });
});

// ─── getRoomAssignments ───────────────────────────────────────────────────────

describe("getRoomAssignments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tüm atamaları döner", async () => {
    const fakeAssignments = [
      {
        id: "ra-1",
        roomId: "room-1",
        programId: "prog-1",
        room: { name: "A-101" },
        program: { name: "Bilgisayar" },
      },
      {
        id: "ra-2",
        roomId: "room-2",
        programId: "prog-2",
        room: { name: "B-202" },
        program: { name: "Elektrik" },
      },
    ];
    mockPrisma.roomAssignment.findMany.mockResolvedValue(fakeAssignments);

    const result = await getRoomAssignments();

    expect(result).toEqual(fakeAssignments);
    expect(mockPrisma.roomAssignment.findMany).toHaveBeenCalledWith({
      include: { room: true, program: true },
    });
  });

  it("atama yoksa boş dizi döner", async () => {
    mockPrisma.roomAssignment.findMany.mockResolvedValue([]);

    const result = await getRoomAssignments();
    expect(result).toEqual([]);
  });
});
