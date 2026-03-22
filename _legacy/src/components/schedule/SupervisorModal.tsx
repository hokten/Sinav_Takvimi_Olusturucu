"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Instructor { id: string; name: string }
interface Exam {
  id: string;
  date: string;
  time: string;
  roomIds: string[];
  course: { code: string; name: string; section: number };
  instructor: { name: string };
}

interface Props {
  exam: Exam;
  instructors: Instructor[];
  existingSupervisors: string[];
  onClose: () => void;
  onSave: (supervisorIds: string[]) => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function SupervisorModal({
  exam,
  instructors,
  existingSupervisors,
  onClose,
  onSave,
  onSuccess,
  onError,
}: Props) {
  const [supervisorIds, setSupervisorIds] = useState<string[]>(existingSupervisors);
  const [loading, setLoading] = useState(false);

  const requiredCount = exam.roomIds.length;

  function toggleSupervisor(name: string) {
    setSupervisorIds((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (supervisorIds.length !== requiredCount) {
      onError(`Tam ${requiredCount} gözetmen seçmelisiniz. (Şu an: ${supervisorIds.length})`);
      return;
    }
    setLoading(true);
    try {
      await onSave(supervisorIds);
      onSuccess("Gözetmenler güncellendi.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const isComplete = supervisorIds.length === requiredCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold">Gözetmen Ata</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Sınav Bilgisi */}
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2.5 text-sm">
            <p className="font-medium text-blue-900">
              [{exam.course.code}] {exam.course.name} Şb.{exam.course.section}
            </p>
            <p className="text-blue-700 text-xs mt-0.5">
              {exam.date} — {exam.time} — {exam.roomIds.length} salon
            </p>
            <p className="text-blue-600 text-xs mt-0.5">Sorumlu: {exam.instructor.name}</p>
          </div>

          {/* Gözetmen Sayısı Uyarısı */}
          <div
            className={`text-sm font-medium px-3 py-2 rounded-md border ${
              isComplete
                ? "bg-green-50 border-green-300 text-green-800"
                : "bg-amber-50 border-amber-300 text-amber-800"
            }`}
          >
            {isComplete
              ? `✓ ${requiredCount} gözetmen seçildi`
              : `${requiredCount} salon için ${requiredCount} gözetmen seçilmelidir (${supervisorIds.length} seçili)`}
          </div>

          {/* Öğretmen Listesi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gözetmenler</label>
            {instructors.length === 0 ? (
              <p className="text-xs text-gray-400">Bölümünüzde kayıtlı öğretim elemanı yok.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {instructors.map((instructor) => {
                  const isSelected = supervisorIds.includes(instructor.name);
                  return (
                    <button
                      key={instructor.id}
                      type="button"
                      onClick={() => toggleSupervisor(instructor.name)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        isSelected
                          ? "bg-yellow-400 border-yellow-500 text-yellow-900 font-medium"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-yellow-50 hover:border-yellow-300"
                      }`}
                    >
                      {instructor.name}
                      {isSelected && " ✓"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seçili Gözetmenler */}
          {supervisorIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {supervisorIds.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded border border-yellow-300"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSupervisorIds((prev) => prev.filter((x) => x !== s))}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !isComplete}
              className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
