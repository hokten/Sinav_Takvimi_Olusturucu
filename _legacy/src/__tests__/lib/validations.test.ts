import { describe, it, expect } from "vitest";
import {
  loginSchema,
  examSchema,
  scheduleDaySchema,
  slotRequestSchema,
} from "@/lib/validations";

// ─── loginSchema ───────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("geçerli email ve şifre kabul eder", () => {
    const result = loginSchema.safeParse({ email: "admin@uni.edu.tr", password: "sifre123" });
    expect(result.success).toBe(true);
  });

  it("geçersiz email formatını reddeder", () => {
    const result = loginSchema.safeParse({ email: "gecersiz-email", password: "sifre123" });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain("email");
  });

  it("boş şifreyi reddeder", () => {
    const result = loginSchema.safeParse({ email: "admin@uni.edu.tr", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toBe("Şifre gereklidir.");
  });

  it("eksik alanları reddeder", () => {
    const result = loginSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

// ─── examSchema ────────────────────────────────────────────────────────────────

describe("examSchema", () => {
  const validExam = {
    courseId: "course-1",
    date: "15.06.2025",
    time: "09:30",
    roomIds: ["room-1"],
    supervisorIds: ["sup-1"],
    instructorId: "instructor-1",
    programId: "program-1",
  };

  it("geçerli sınav verisini kabul eder", () => {
    const result = examSchema.safeParse(validExam);
    expect(result.success).toBe(true);
  });

  it("supervisorIds boş dizi olarak default değeri alır", () => {
    const { supervisorIds: _, ...withoutSupervisors } = validExam;
    const result = examSchema.safeParse(withoutSupervisors);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.supervisorIds).toEqual([]);
  });

  it("yanlış tarih formatını (YYYY-MM-DD) reddeder", () => {
    const result = examSchema.safeParse({ ...validExam, date: "2025-06-15" });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain("tarih");
  });

  it("yanlış tarih formatını (GG/AA/YYYY) reddeder", () => {
    const result = examSchema.safeParse({ ...validExam, date: "15/06/2025" });
    expect(result.success).toBe(false);
  });

  it("yanlış saat formatını (9:30) reddeder", () => {
    const result = examSchema.safeParse({ ...validExam, time: "9:30" });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain("saat");
  });

  it("yanlış saat formatını (09:3) reddeder", () => {
    const result = examSchema.safeParse({ ...validExam, time: "09:3" });
    expect(result.success).toBe(false);
  });

  it("boş roomIds dizisini reddeder", () => {
    const result = examSchema.safeParse({ ...validExam, roomIds: [] });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain("derslik");
  });

  it("boş courseId reddeder", () => {
    const result = examSchema.safeParse({ ...validExam, courseId: "" });
    expect(result.success).toBe(false);
  });

  it("boş instructorId reddeder", () => {
    const result = examSchema.safeParse({ ...validExam, instructorId: "" });
    expect(result.success).toBe(false);
  });

  it("boş programId reddeder", () => {
    const result = examSchema.safeParse({ ...validExam, programId: "" });
    expect(result.success).toBe(false);
  });

  it("birden fazla salon kabul eder", () => {
    const result = examSchema.safeParse({ ...validExam, roomIds: ["room-1", "room-2", "room-3"] });
    expect(result.success).toBe(true);
  });
});

// ─── scheduleDaySchema ────────────────────────────────────────────────────────

describe("scheduleDaySchema", () => {
  it("geçerli tarih ve oturumları kabul eder", () => {
    const result = scheduleDaySchema.safeParse({
      date: "15.06.2025",
      sessions: ["09:30", "11:00", "13:00", "14:30"],
    });
    expect(result.success).toBe(true);
  });

  it("boş oturumlar dizisini kabul eder", () => {
    const result = scheduleDaySchema.safeParse({ date: "15.06.2025", sessions: [] });
    expect(result.success).toBe(true);
  });

  it("yanlış tarih formatını reddeder", () => {
    const result = scheduleDaySchema.safeParse({ date: "2025-06-15", sessions: ["09:00"] });
    expect(result.success).toBe(false);
  });

  it("oturumda yanlış saat formatını reddeder", () => {
    const result = scheduleDaySchema.safeParse({ date: "15.06.2025", sessions: ["9:30"] });
    expect(result.success).toBe(false);
  });

  it("farklı sayıda oturumu kabul eder (5 oturum)", () => {
    const result = scheduleDaySchema.safeParse({
      date: "20.06.2025",
      sessions: ["09:00", "11:00", "13:00", "14:00", "16:00"],
    });
    expect(result.success).toBe(true);
  });
});

// ─── slotRequestSchema ────────────────────────────────────────────────────────

describe("slotRequestSchema", () => {
  const validRequest = {
    roomId: "room-1",
    date: "15.06.2025",
    time: "09:30",
  };

  it("geçerli talep verisini kabul eder", () => {
    const result = slotRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("boş roomId reddeder", () => {
    const result = slotRequestSchema.safeParse({ ...validRequest, roomId: "" });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain("Derslik");
  });

  it("yanlış tarih formatını reddeder", () => {
    const result = slotRequestSchema.safeParse({ ...validRequest, date: "2025/06/15" });
    expect(result.success).toBe(false);
  });

  it("yanlış saat formatını reddeder", () => {
    const result = slotRequestSchema.safeParse({ ...validRequest, time: "930" });
    expect(result.success).toBe(false);
  });
});
