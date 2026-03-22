"use client";

import { User } from "lucide-react";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    departmentName?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const roleLabel = user.role === "ADMIN" ? "Sistem Yöneticisi" : "Bölüm Başkanı";

  return (
    <header className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">
            {roleLabel}
            {user.departmentName ? ` — ${user.departmentName}` : ""}
          </p>
        </div>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User size={16} className="text-blue-600" />
        </div>
      </div>
    </header>
  );
}
