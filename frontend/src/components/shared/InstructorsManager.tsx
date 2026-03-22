"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { createInstructor, updateInstructor, deleteInstructor } from "@/app/actions/instructors";

interface Program { id: string; name: string; color: string }
interface Instructor { id: string; name: string; mainProgramId: string; sideProgramIds: string[]; mainProgram: Program }

interface Props {
  instructors: Instructor[];
  programs: Program[];
}

interface FormState {
  name: string;
  mainProgramId: string;
  sideProgramIds: string[];
}

const EMPTY_FORM: FormState = { name: "", mainProgramId: "", sideProgramIds: [] };

export function InstructorsManager({ instructors, programs }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(inst: Instructor) {
    setEditId(inst.id);
    setForm({ name: inst.name, mainProgramId: inst.mainProgramId, sideProgramIds: inst.sideProgramIds });
    setError("");
    setShowForm(true);
  }

  function toggleSideProgram(programId: string) {
    setForm((prev) => ({
      ...prev,
      sideProgramIds: prev.sideProgramIds.includes(programId)
        ? prev.sideProgramIds.filter((id) => id !== programId)
        : [...prev.sideProgramIds, programId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.mainProgramId) {
      setError("Ad ve ana program zorunludur.");
      return;
    }
    const sidePrograms = form.sideProgramIds.filter((id) => id !== form.mainProgramId);
    setLoading(true);
    setError("");
    try {
      if (editId) {
        await updateInstructor(editId, { name: form.name.trim(), mainProgramId: form.mainProgramId, sideProgramIds: sidePrograms });
      } else {
        await createInstructor({ name: form.name.trim(), mainProgramId: form.mainProgramId, sideProgramIds: sidePrograms });
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" adlı öğretim elemanını silmek istiyor musunuz?`)) return;
    try {
      await deleteInstructor(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu.");
    }
  }

  const programMap = Object.fromEntries(programs.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{instructors.length} öğretim elemanı</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={14} />
          Öğretim Elemanı Ekle
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {instructors.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">Henüz öğretim elemanı eklenmemiş.</p>
        )}
        {instructors.map((inst) => {
          const mainProgram = programMap[inst.mainProgramId];
          const sidePrograms = inst.sideProgramIds.map((id) => programMap[id]).filter(Boolean);
          return (
            <div key={inst.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">{inst.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mainProgram && (
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: mainProgram.color + "20", color: mainProgram.color }}
                    >
                      {mainProgram.name} (Ana)
                    </span>
                  )}
                  {sidePrograms.map((prog) => prog && (
                    <span
                      key={prog.id}
                      className="inline-block px-1.5 py-0.5 rounded text-xs"
                      style={{ backgroundColor: prog.color + "15", color: prog.color, border: `1px solid ${prog.color}40` }}
                    >
                      {prog.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(inst)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Düzenle"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(inst.id, inst.name)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold">
                {editId ? "Öğretim Elemanı Düzenle" : "Yeni Öğretim Elemanı"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="Dr. Ahmet Yılmaz"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ana Program</label>
                <select
                  value={form.mainProgramId}
                  onChange={(e) => setForm((p) => ({ ...p, mainProgramId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  required
                >
                  <option value="">Program seçiniz...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İkincil Programlar (opsiyonel)</label>
                <div className="flex flex-wrap gap-2">
                  {programs
                    .filter((p) => p.id !== form.mainProgramId)
                    .map((prog) => {
                      const selected = form.sideProgramIds.includes(prog.id);
                      return (
                        <button
                          key={prog.id}
                          type="button"
                          onClick={() => toggleSideProgram(prog.id)}
                          className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                            selected
                              ? "text-white border-transparent"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                          style={selected ? { backgroundColor: prog.color, borderColor: prog.color } : {}}
                        >
                          {prog.name}
                        </button>
                      );
                    })}
                  {programs.filter((p) => p.id !== form.mainProgramId).length === 0 && (
                    <p className="text-xs text-gray-400">Ana program seçildikten sonra ikincil programlar gösterilir.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Kaydediliyor..." : editId ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
