import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin."),
  password: z.string().min(1, "Şifre gereklidir."),
});

export const examSchema = z.object({
  courseId: z.string().min(1, "Ders seçiniz."),
  date: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Geçersiz tarih formatı (GG.AA.YYYY)."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat formatı (SS:DD)."),
  roomIds: z.array(z.string()).min(1, "En az bir derslik seçiniz."),
  supervisorIds: z.array(z.string()).default([]),
  instructorId: z.string().min(1, "Öğretim elemanı gereklidir."),
  programId: z.string().min(1, "Program gereklidir."),
});

export const scheduleDaySchema = z.object({
  date: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Geçersiz tarih formatı (GG.AA.YYYY)."),
  sessions: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat formatı.")),
});

export const slotRequestSchema = z.object({
  roomId: z.string().min(1, "Derslik seçiniz."),
  date: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Geçersiz tarih formatı."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat formatı."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type ScheduleDayInput = z.infer<typeof scheduleDaySchema>;
export type SlotRequestInput = z.infer<typeof slotRequestSchema>;
