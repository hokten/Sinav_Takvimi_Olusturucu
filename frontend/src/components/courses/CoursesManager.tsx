"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import { createCourse, updateCourse, deleteCourse } from "@/app/actions/courses";
import { courseSchema } from "@/lib/validations";
import { CourseImportModal } from "./CourseImportModal";

interface Program { id: string; name: string; color: string }
interface Instructor { id: string; name: string; mainProgramId: string; sideProgramIds: string[] }
interface Course {
  id: string;
  code: string;
  name: string;
  section: number;
  grade: number;
  quota: number;
  programId: string;
  instructorId: string;
  adminOnly: boolean;
  program: { id: string; name: string; color: string };
  instructor: Instructor;
}

interface Props {
  courses: Course[];
  programs: Program[];
  instructors: Instructor[];
  onRefresh?: () => void;
}

interface FormState {
  code: string;
  name: string;
  section: number;
  grade: number;
  quota: number;
  programId: string;
  instructorId: string;
  adminOnly: boolean;
}

const EMPTY_FORM: FormState = {
  code: "", name: "", section: 1, grade: 1, quota: 30,
  programId: "", instructorId: "", adminOnly: false,
};

export function CoursesManager({ courses, programs, instructors, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progFilter, setProgFilter] = useState("");

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(course: Course) {
    setEditId(course.id);
    setForm({
      code: course.code,
      name: course.name,
      section: course.section,
      grade: course.grade,
      quota: course.quota,
      programId: course.programId,
      instructorId: course.instructorId,
      adminOnly: course.adminOnly,
    });
    setError("");
    setShowForm(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure numeric types for Zod
    const payload = {
      ...form,
      section: Number(form.section),
      quota: Number(form.quota)
    };

    const validation = courseSchema.safeParse(payload);
    if (!validation.success) {
      alert(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = { ...form, code: form.code.trim(), name: form.name.trim() };
      if (editId) {
        await updateCourse(editId, data);
      } else {
        await createCourse(data);
      }
      setShowForm(false);
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" dersini silmek istiyor musunuz?`)) return;
    try {
      await deleteCourse(id);
      onRefresh?.();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Hata oluştu.");
    }
  }

  // Instructors filtered by selected program in form
  const filteredInstructors = form.programId
    ? instructors.filter(
        (i) => i.mainProgramId === form.programId || i.sideProgramIds.includes(form.programId)
      )
    : instructors;

  const displayedCourses = progFilter
    ? courses.filter((c) => c.programId === progFilter)
    : courses;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{displayedCourses.length} ders</p>
          <select
            value={progFilter}
            onChange={(e) => setProgFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="">Tüm programlar</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FileSpreadsheet size={14} />
            Excel&apos;den İçe Aktar
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={14} />
            Ders Ekle
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {displayedCourses.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">Henüz ders eklenmemiş.</p>
        )}
        {displayedCourses.map((course) => (
          <div key={course.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono font-semibold text-sm text-gray-900">{course.code}</p>
                <p className="text-sm text-gray-700">{course.name}</p>
                <span className="text-xs text-gray-400">Şb.{course.section}</span>
                {course.adminOnly && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Sadece Admin</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: course.program.color + "20", color: course.program.color }}
                >
                  {course.program.name}
                </span>
                <span className="text-xs text-gray-500">{course.instructor.name}</span>
                <span className="text-xs text-gray-400">{course.grade}. Sınıf · {course.quota} kişi</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(course)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Düzenle"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(course.id, course.name)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Sil"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Import Modal */}
      {showImport && (
        <CourseImportModal
          onClose={() => setShowImport(false)}
          programs={programs}
          instructors={instructors}
        />
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold">{editId ? "Ders Düzenle" : "Yeni Ders"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ders Kodu</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    placeholder="BIL-101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şube No</label>
                  <input
                    type="number"
                    value={form.section}
                    onChange={(e) => setForm((p) => ({ ...p, section: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ders Adı</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="Programlamaya Giriş"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf</label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm((p) => ({ ...p, grade: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  >
                    {[1, 2, 3, 4].map((g) => <option key={g} value={g}>{g}. Sınıf</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontenjan</label>
                  <input
                    type="number"
                    value={form.quota}
                    onChange={(e) => setForm((p) => ({ ...p, quota: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={form.programId}
                  onChange={(e) => setForm((p) => ({ ...p, programId: e.target.value, instructorId: "" }))}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Öğretim Elemanı</label>
                <select
                  value={form.instructorId}
                  onChange={(e) => setForm((p) => ({ ...p, instructorId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  required
                  disabled={!form.programId}
                >
                  <option value="">Öğretim elemanı seçiniz...</option>
                  {filteredInstructors.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="adminOnly"
                  checked={form.adminOnly}
                  onChange={(e) => setForm((p) => ({ ...p, adminOnly: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="adminOnly" className="text-sm text-gray-700">
                  Sadece admin düzenleyebilir
                </label>
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
