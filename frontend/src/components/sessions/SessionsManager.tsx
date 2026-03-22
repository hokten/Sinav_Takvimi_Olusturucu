"use client";

import { useState } from "react";
import { createScheduleDay, updateScheduleDay, deleteScheduleDay } from "@/app/actions/sessions";
import { Plus, Trash2, X } from "lucide-react";
import { Toast } from "@/components/shared/Toast";

interface ScheduleDay {
  id: string;
  date: string;
  sessions: string[];
}

interface Props {
  scheduleDays: ScheduleDay[];
  onRefresh?: () => void;
}

export function SessionsManager({ scheduleDays: initialDays, onRefresh }: Props) {
  const [days, setDays] = useState(initialDays);
  const [newDate, setNewDate] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [sessionInputs, setSessionInputs] = useState<Record<string, string>>({});

  async function handleAddDay() {
    if (!newDate) return;
    // Convert YYYY-MM-DD to DD.MM.YYYY
    const [y, m, d] = newDate.split("-");
    const formatted = `${d}.${m}.${y}`;
    try {
      await createScheduleDay({ date: formatted, sessions: [] });
      setToast({ message: "Gün eklendi.", type: "success" });
      setDays((prev) => [...prev, { id: Date.now().toString(), date: formatted, sessions: [] }]);
      setNewDate("");
      onRefresh?.();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || err.message || "Hata oluştu.", type: "error" });
    }
  }

  async function handleDeleteDay(id: string) {
    if (!confirm("Bu günü silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteScheduleDay(id);
      setDays((prev) => prev.filter((d) => d.id !== id));
      setToast({ message: "Gün silindi.", type: "success" });
      onRefresh?.();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || err.message || "Hata oluştu.", type: "error" });
    }
  }

  async function handleAddSession(dayId: string) {
    const input = sessionInputs[dayId]?.trim();
    if (!input || !/^\d{2}:\d{2}$/.test(input)) {
      setToast({ message: "Saat formatı SS:DD olmalıdır.", type: "error" });
      return;
    }
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    if (day.sessions.includes(input)) {
      setToast({ message: "Bu saat zaten mevcut.", type: "error" });
      return;
    }
    const newSessions = [...day.sessions, input].sort();
    try {
      await updateScheduleDay(dayId, newSessions);
      setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, sessions: newSessions } : d));
      setSessionInputs((prev) => ({ ...prev, [dayId]: "" }));
      onRefresh?.();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || err.message || "Hata oluştu.", type: "error" });
    }
  }

  async function handleRemoveSession(dayId: string, session: string) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const newSessions = day.sessions.filter((s) => s !== session);
    try {
      await updateScheduleDay(dayId, newSessions);
      setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, sessions: newSessions } : d));
      onRefresh?.();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || err.message || "Hata oluştu.", type: "error" });
    }
  }

  const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  function getDayName(dateStr: string) {
    const [d, m, y] = dateStr.split(".").map(Number);
    return DAYS_TR[new Date(y, m - 1, d).getDay()];
  }

  return (
    <div className="space-y-4">
      {/* Add day */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Yeni Sınav Günü Ekle</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleAddDay}
            disabled={!newDate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={14} />
            Gün Ekle
          </button>
        </div>
      </div>

      {/* Days list */}
      {days.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Henüz sınav günü tanımlanmamış.</p>
      ) : (
        <div className="grid gap-4">
          {days.map((day) => (
            <div key={day.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-gray-900">{day.date}</span>
                  <span className="ml-2 text-sm text-gray-500">{getDayName(day.date)}</span>
                </div>
                <button
                  onClick={() => handleDeleteDay(day.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Sessions */}
              <div className="flex flex-wrap gap-2 mb-3">
                {day.sessions.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-sm rounded border border-blue-200"
                  >
                    {s}
                    <button
                      onClick={() => handleRemoveSession(day.id, s)}
                      className="hover:text-red-600 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {day.sessions.length === 0 && (
                  <span className="text-xs text-gray-400">Henüz oturum saati eklenmemiş.</span>
                )}
              </div>

              {/* Add session input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sessionInputs[day.id] ?? ""}
                  onChange={(e) => setSessionInputs((prev) => ({ ...prev, [day.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSession(day.id); } }}
                  placeholder="09:30"
                  maxLength={5}
                  className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
                <button
                  onClick={() => handleAddSession(day.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                >
                  <Plus size={12} />
                  Saat Ekle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
