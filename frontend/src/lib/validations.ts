import { z } from "zod";

const dateSchema = z.string().regex(/^(\d{2}\.\d{2}\.\d{4})|(\d{4}-\d{2}-\d{2})$/, "Geçersiz tarih formatı.");

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin."),
  password: z.string().min(1, "Şifre gereklidir."),
});

export const examSchema = z.object({
  courseId: z.string().min(1, "Ders seçiniz."),
  date: dateSchema,
  time: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat formatı (SS:DD)."),
  roomIds: z.array(z.string()).min(1, "En az bir derslik seçiniz."),
  supervisorIds: z.array(z.string()).default([]),
  instructorId: z.string().min(1, "Öğretim elemanı gereklidir."),
  programId: z.string().min(1, "Program gereklidir."),
});

export const scheduleDaySchema = z.object({
  date: dateSchema,
  sessions: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat formatı.")),
});

export const slotRequestSchema = z.object({
  programId: z.string().min(1, "Program seçiniz."),
  roomId: z.string().min(1, "Derslik seçiniz."),
  date: dateSchema,
  time: z.string().min(1, "Saat seçiniz."),
});

export const supervisorSchema = z.object({
  supervisorIds: z.array(z.string()),
  requiredCount: z.number(),
}).refine((data) => data.supervisorIds.length === data.requiredCount, {
  message: "Gözetmen sayısı salon sayısına eşit olmalıdır.",
  path: ["supervisorIds"],
});

export const courseSchema = z.object({
  code: z.string().min(1, "Ders kodu gereklidir."),
  name: z.string().min(1, "Ders adı gereklidir."),
  section: z.number().min(1, "Şube en az 1 olmalıdır."),
  quota: z.number().min(1, "Kontenjan en az 1 olmalıdır."),
  instructorId: z.string().min(1, "Öğretim elemanı seçiniz."),
  programId: z.string().min(1, "Program seçiniz."),
});

export const instructorSchema = z.object({
  name: z.string().min(1, "İsim gereklidir."),
  mainProgramId: z.string().min(1, "Ana program seçiniz."),
});

export const roomSchema = z.object({
  name: z.string().min(1, "Salon adı gereklidir."),
  capacity: z.number().min(1, "Kapasite en az 1 olmalıdır."),
  isLab: z.boolean().default(false),
});

export const userSchema = z.object({
  email: z.string().email("Geçerli bir email girin."),
  name: z.string().min(1, "İsim gereklidir."),
  role: z.string().refine(val => ["ADMIN", "DEPT_HEAD"].includes(val), { 
    message: "Rol seçiniz." 
  }),
  departmentId: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type ScheduleDayInput = z.infer<typeof scheduleDaySchema>;
export type SlotRequestInput = z.infer<typeof slotRequestSchema>;
export type SupervisorInput = z.infer<typeof supervisorSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type InstructorInput = z.infer<typeof instructorSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type UserInput = z.infer<typeof userSchema>;

export const departmentSchema = z.object({
  name: z.string().min(1, "Bölüm adı gereklidir."),
});

export const programSchema = z.object({
  name: z.string().min(1, "Program adı gereklidir."),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Geçersiz renk formatı."),
  isSharedSource: z.boolean().default(false),
  departmentId: z.string().min(1, "Bölüm seçiniz."),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type ProgramInput = z.infer<typeof programSchema>;
