"use client";

import { useSession } from "next-auth/react";

export function usePermissions() {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";
  const isDeptHead = session?.user?.role === "DEPT_HEAD";
  const programId = session?.user?.programId ?? null;
  const programIds = session?.user?.programIds ?? [];
  const userId = session?.user?.id ?? null;

  function canEditExam(examProgramId: string, adminOnly: boolean) {
    if (isAdmin) return true;
    if (adminOnly) return false;
    return programIds.includes(examProgramId);
  }

  return { isAdmin, isDeptHead, programId, programIds, userId, canEditExam, session };
}
