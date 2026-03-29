"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supervisorSchema } from "../../lib/validations";
import { getErrorMessage } from "@/lib/error-utils";

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
  existingExams: { instructorId: string; supervisorIds: string[]; date: string; time: string; id: string }[];
  onClose: () => void;
  onSave: (supervisorIds: string[]) => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function SupervisorModal({
  exam,
  instructors,
  existingSupervisors,
  existingExams,
  onClose,
  onSave,
  onSuccess,
  onError,
}: Props) {
  const [supervisorIds, setSupervisorIds] = useState<string[]>(existingSupervisors);
  const [loading, setLoading] = useState(false);

  const requiredCount = exam.roomIds.length;

  const examsAtSlot = existingExams.filter(
    (e: any) => e.date === exam.date && e.time === exam.time && e.id !== exam.id
  );
  
  const instructorMap = new Map(instructors.map((i) => [i.id, i.name]));
  const busySupervisorNames = new Set(examsAtSlot.flatMap((e) => e.supervisorIds));
  const busyInstructorNamesFromIds = new Set(
    examsAtSlot
      .map((e) => instructorMap.get(e.instructorId))
      .filter(Boolean) as string[]
  );

  const allBusyNames = new Set([...busySupervisorNames, ...busyInstructorNamesFromIds]);

  function toggleSupervisor(name: string) {
    setSupervisorIds((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const validation = supervisorSchema.safeParse({
      supervisorIds,
      requiredCount
    });

    if (!validation.success) {
      onError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await onSave(supervisorIds);
      onSuccess("Gözetmenler güncellendi.");
    } catch (err) {
      onError(getErrorMessage(err));
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Öğretim Elemanları</label>
            {instructors.length === 0 ? (
              <p className="text-xs text-gray-400 italic font-normal">Bölümünüzde kayıtlı öğretim elemanı yok.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                {instructors.map((instructor) => {
                  const isBusy = allBusyNames.has(instructor.name);
                  const isSelected = supervisorIds.includes(instructor.name);

                  return (
                    <button
                      key={instructor.id}
                      type="button"
                      onClick={() => toggleSupervisor(instructor.name)}
                      disabled={isBusy}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-all text-left flex flex-col gap-0.5 ${
                        isBusy
                          ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-60 line-through"
                          : isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-100 font-medium"
                          : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                      title={isBusy ? "Bu saatte başka görevi var" : ""}
                    >
                      <span>{instructor.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seçili Gözetmenler Özet */}
          {supervisorIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 w-full mb-1">Seçilen Gözetmenler:</span>
              {supervisorIds.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSupervisorIds((prev) => prev.filter((x) => x !== s))}
                    className="hover:text-red-600 font-bold ml-1"
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
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
