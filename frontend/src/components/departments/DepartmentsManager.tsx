import { useState } from "react";
import { X, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/app/actions/departments";
import {
  createProgram,
  updateProgram,
  deleteProgram,
} from "@/app/actions/programs";
import { departmentSchema, programSchema } from "@/lib/validations";

interface Program {
  id: string;
  name: string;
  color: string;
  departmentId: string;
  isSharedSource: boolean;
}

interface Department {
  id: string;
  name: string;
  programs: Program[];
}

interface Props {
  departments: Department[];
  onRefresh?: () => void;
}

interface DeptFormState { name: string }
interface ProgFormState { name: string; color: string; isSharedSource: boolean; departmentId: string }

const EMPTY_PROG_FORM: ProgFormState = { name: "", color: "#3B82F6", isSharedSource: false, departmentId: "" };

export function DepartmentsManager({ departments, onRefresh }: Props) {
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState<DeptFormState>({ name: "" });

  const [showProgForm, setShowProgForm] = useState(false);
  const [editProgId, setEditProgId] = useState<string | null>(null);
  const [progForm, setProgForm] = useState<ProgFormState>(EMPTY_PROG_FORM);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Department actions ---
  function openAddDept() {
    setEditDeptId(null);
    setDeptForm({ name: "" });
    setError("");
    setShowDeptForm(true);
  }

  function openEditDept(dept: Department) {
    setEditDeptId(dept.id);
    setDeptForm({ name: dept.name });
    setError("");
    setShowDeptForm(true);
  }

  async function handleDeptSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = departmentSchema.safeParse(deptForm);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    setLoading(true); setError("");
    try {
      if (editDeptId) {
        await updateDepartment(editDeptId, { name: deptForm.name });
      } else {
        await createDepartment({ name: deptForm.name });
      }
      setShowDeptForm(false);
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDept(id: string, name: string) {
    if (!confirm(`"${name}" bölümü silinsin mi? Bağlı programlar varsa silinemez.`)) return;
    try { 
      await deleteDepartment(id); 
      onRefresh?.();
    } catch (err: any) { 
      alert(err.response?.data?.message || err.message || "Hata oluştu."); 
    }
  }

  // --- Program actions ---
  function openAddProg(departmentId: string) {
    setEditProgId(null);
    setProgForm({ ...EMPTY_PROG_FORM, departmentId });
    setError("");
    setShowProgForm(true);
  }

  function openEditProg(prog: Program) {
    setEditProgId(prog.id);
    setProgForm({ name: prog.name, color: prog.color, isSharedSource: prog.isSharedSource, departmentId: prog.departmentId });
    setError("");
    setShowProgForm(true);
  }

  async function handleProgSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = programSchema.safeParse(progForm);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    setLoading(true); setError("");
    try {
      if (editProgId) {
        await updateProgram(editProgId, { name: progForm.name, color: progForm.color, isSharedSource: progForm.isSharedSource, departmentId: progForm.departmentId });
      } else {
        await createProgram({ name: progForm.name, color: progForm.color, isSharedSource: progForm.isSharedSource, departmentId: progForm.departmentId });
      }
      setShowProgForm(false);
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProg(id: string, name: string) {
    if (!confirm(`"${name}" programı silinsin mi?`)) return;
    try { 
      await deleteProgram(id); 
      onRefresh?.();
    } catch (err: any) { 
      alert(err.response?.data?.message || err.message || "Hata oluştu."); 
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{departments.length} bölüm</p>
        <button
          onClick={openAddDept}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={14} />
          Bölüm Ekle
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {departments.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">Henüz bölüm eklenmemiş.</p>
        )}
        {departments.map((dept) => (
          <div key={dept.id}>
            {/* Department row */}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{dept.name}</p>
                <p className="text-xs text-gray-400">{dept.programs.length} program</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openAddProg(dept.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  + Program
                </button>
                <button
                  onClick={() => openEditDept(dept)}
                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                  title="Düzenle"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDeleteDept(dept.id, dept.name)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {/* Program rows */}
            {dept.programs.map((prog) => (
              <div
                key={prog.id}
                className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100"
                style={{ paddingLeft: "40px" }}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight size={12} className="text-gray-400" />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: prog.color }}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-gray-800 text-sm">{prog.name}</p>
                      {prog.isSharedSource && (
                        <span className="text-xs bg-purple-100 text-purple-700 border border-purple-300 px-1.5 py-0.5 rounded font-medium">
                          Yüksekokul
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">Program</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditProg(prog)}
                    className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                    title="Düzenle"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteProg(prog.id, prog.name)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Department form modal */}
      {showDeptForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold">
                {editDeptId ? "Bölümü Düzenle" : "Bölüm Ekle"}
              </h2>
              <button onClick={() => setShowDeptForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDeptSubmit} className="px-5 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bölüm Adı</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="Amasya Teknik Bilimler MYO"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDeptForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Kaydediliyor..." : editDeptId ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program form modal */}
      {showProgForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold">
                {editProgId ? "Programı Düzenle" : "Program Ekle"}
              </h2>
              <button onClick={() => setShowProgForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleProgSubmit} className="px-5 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Adı</label>
                <input
                  type="text"
                  value={progForm.name}
                  onChange={(e) => setProgForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="Bilgisayar Programcılığı"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={progForm.color}
                    onChange={(e) => setProgForm((p) => ({ ...p, color: e.target.value }))}
                    className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{progForm.color}</span>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={progForm.isSharedSource}
                    onChange={(e) => setProgForm((p) => ({ ...p, isSharedSource: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Yüksekokul paylaşımlı kaynak</span>
                </label>
                <p className="text-xs text-gray-400 mt-0.5 ml-5">
                  Bu programa eklenen sınavlar tüm programların takvimine otomatik yansır.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowProgForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Kaydediliyor..." : editProgId ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
