"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userCreateSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  email: z.string().email("Geçerli e-posta giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  role: z.enum(["ADMIN", "DEPT_HEAD"]),
  departmentId: z.string().nullable().optional(),
});

const userUpdateSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  email: z.string().email("Geçerli e-posta giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter").or(z.literal("")).optional(),
  role: z.enum(["ADMIN", "DEPT_HEAD"]),
  departmentId: z.string().nullable().optional(),
});

async function assignDepartmentPrograms(userId: string, departmentId: string) {
  const programs = await prisma.program.findMany({
    where: { departmentId },
    select: { id: true },
  });
  for (const program of programs) {
    await prisma.userProgram.upsert({
      where: { userId_programId: { userId, programId: program.id } },
      update: { type: "MAIN" },
      create: { userId, programId: program.id, type: "MAIN" },
    });
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  departmentId?: string | null;
}) {
  await requireAdmin();
  const parsed = userCreateSchema.parse(data);

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) throw new Error("Bu e-posta adresi zaten kayıtlı.");

  const hashedPassword = await bcrypt.hash(parsed.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      role: parsed.role,
    },
  });

  if (parsed.departmentId && parsed.role === "DEPT_HEAD") {
    await assignDepartmentPrograms(user.id, parsed.departmentId);
  }

  revalidatePath("/users");
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    email: string;
    password?: string;
    role: string;
    departmentId?: string | null;
  }
) {
  const currentAdmin = await requireAdmin();
  const parsed = userUpdateSchema.parse(data);

  if (id === currentAdmin.user.id && parsed.role !== "ADMIN") {
    throw new Error("Kendi yönetici rolünüzü değiştiremezsiniz.");
  }

  const updateData: {
    name: string;
    email: string;
    role: "ADMIN" | "DEPT_HEAD";
    password?: string;
  } = {
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
  };

  if (parsed.password) {
    updateData.password = await bcrypt.hash(parsed.password, 10);
  }

  await prisma.user.update({ where: { id }, data: updateData });

  await prisma.userProgram.deleteMany({ where: { userId: id, type: "MAIN" } });
  if (parsed.departmentId && parsed.role === "DEPT_HEAD") {
    await assignDepartmentPrograms(id, parsed.departmentId);
  }

  revalidatePath("/users");
}

export async function deleteUser(id: string) {
  const currentAdmin = await requireAdmin();
  if (id === currentAdmin.user.id) throw new Error("Kendi hesabınızı silemezsiniz.");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
}
