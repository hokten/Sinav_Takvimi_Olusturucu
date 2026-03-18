import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Oturum açmanız gerekiyor.");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Bu işlem için admin yetkisi gerekiyor.");
  return session;
}

export function isAdmin(role: string) {
  return role === "ADMIN";
}

export function canEditExam(
  role: string,
  examDeptId: string,
  userDeptId: string | null | undefined,
  adminOnly: boolean
) {
  if (role === "ADMIN") return true;
  if (adminOnly) return false;
  return examDeptId === userDeptId;
}
