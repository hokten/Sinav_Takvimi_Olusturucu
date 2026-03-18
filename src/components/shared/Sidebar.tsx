"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ClipboardList,
  Building2,
  User,
  Settings,
  LayoutGrid,
  MessageSquare,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  role: string;
}

const navItems = [
  { href: "/schedule", label: "Sınav Programı", icon: ClipboardList, adminOnly: false },
  { href: "/room-program", label: "Salon Programı", icon: Building2, adminOnly: false },
  { href: "/instructor-program", label: "Hoca Programı", icon: User, adminOnly: false },
  { href: "/sessions", label: "Oturum Yönetimi", icon: Settings, adminOnly: true },
  { href: "/room-assignments", label: "Sınıf Atamaları", icon: LayoutGrid, adminOnly: true },
  { href: "/requests", label: "Talepler", icon: MessageSquare, adminOnly: false },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";

  return (
    <aside className="no-print w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-sm font-bold text-gray-100">Sınav Planlama</h1>
        <p className="text-xs text-gray-400 mt-0.5">Amasya Üniversitesi</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={16} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
