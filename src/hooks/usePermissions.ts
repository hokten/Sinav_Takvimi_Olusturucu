"use client";

import { useSession } from "next-auth/react";

export function usePermissions() {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";
  const isDeptHead = session?.user?.role === "DEPT_HEAD";
  const departmentId = session?.user?.departmentId ?? null;
  const userId = session?.user?.id ?? null;

  function canEditExam(examDeptId: string, adminOnly: boolean) {
    if (isAdmin) return true;
    if (adminOnly) return false;
    return examDeptId === departmentId;
  }

  return { isAdmin, isDeptHead, departmentId, userId, canEditExam, session };
}
