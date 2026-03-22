"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
});

export async function createDepartment(data: { name: string }) {
  await requireAdmin();
  const parsed = departmentSchema.parse(data);
  await prisma.department.create({ data: { name: parsed.name } });
  revalidatePath("/departments");
}

export async function updateDepartment(id: string, data: { name: string }) {
  await requireAdmin();
  const parsed = departmentSchema.parse(data);
  await prisma.department.update({ where: { id }, data: { name: parsed.name } });
  revalidatePath("/departments");
}

export async function deleteDepartment(id: string) {
  await requireAdmin();

  const hasPrograms = await prisma.program.findFirst({ where: { departmentId: id } });
  if (hasPrograms) throw new Error("Bu bölümün altında programlar var, önce programları silin.");

  await prisma.department.delete({ where: { id } });
  revalidatePath("/departments");
}
