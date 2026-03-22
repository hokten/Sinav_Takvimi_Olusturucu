import { describe, it, expect } from "vitest";
import { isAdmin, canEditExam } from "@/lib/permissions";

// ─── isAdmin ──────────────────────────────────────────────────────────────────

describe("isAdmin", () => {
  it("ADMIN rolünde true döner", () => {
    expect(isAdmin("ADMIN")).toBe(true);
  });

  it("DEPT_HEAD rolünde false döner", () => {
    expect(isAdmin("DEPT_HEAD")).toBe(false);
  });

  it("bilinmeyen roldü false döner", () => {
    expect(isAdmin("UNKNOWN")).toBe(false);
  });
});

// ─── canEditExam ──────────────────────────────────────────────────────────────

describe("canEditExam", () => {
  it("ADMIN her zaman düzenleyebilir (kendi programı)", () => {
    expect(canEditExam("ADMIN", "prog-1", "prog-1", false)).toBe(true);
  });

  it("ADMIN adminOnly dersi düzenleyebilir", () => {
    expect(canEditExam("ADMIN", "prog-1", "prog-1", true)).toBe(true);
  });

  it("ADMIN başka programın sınavını düzenleyebilir", () => {
    expect(canEditExam("ADMIN", "prog-2", "prog-1", false)).toBe(true);
  });

  it("DEPT_HEAD kendi programının normal sınavını düzenleyebilir", () => {
    expect(canEditExam("DEPT_HEAD", "prog-1", "prog-1", false)).toBe(true);
  });

  it("DEPT_HEAD başka programın sınavını düzenleyemez", () => {
    expect(canEditExam("DEPT_HEAD", "prog-2", "prog-1", false)).toBe(false);
  });

  it("DEPT_HEAD adminOnly sınavı düzenleyemez (kendi programı olsa bile)", () => {
    expect(canEditExam("DEPT_HEAD", "prog-1", "prog-1", true)).toBe(false);
  });

  it("DEPT_HEAD programId null iken düzenleyemez", () => {
    expect(canEditExam("DEPT_HEAD", "prog-1", null, false)).toBe(false);
  });

  it("DEPT_HEAD programId undefined iken düzenleyemez", () => {
    expect(canEditExam("DEPT_HEAD", "prog-1", undefined, false)).toBe(false);
  });
});
