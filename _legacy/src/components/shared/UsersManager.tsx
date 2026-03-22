"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2, Shield, User } from "lucide-react";
import { createUser, updateUser, deleteUser } from "@/app/actions/users";

interface Department {
  id: string;
  name: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "DEPT_HEAD";
  programs: {
    programId: string;
    type: string;
    program: {
      id: string;
      name: string;
      color: string;
      department: Department;
    };
  }[];
}

interface Props {
  users: UserItem[];
  departments: Department[];
  currentUserId: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "DEPT_HEAD";
  departmentId: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "DEPT_HEAD",
  departmentId: "",
};

function getUserDepartment(user: UserItem): Department | undefined {
  const mainProg = user.programs.find((p) => p.type === "MAIN");
  return mainProg?.program.department;
}

export function UsersManager({ users, departments, currentUserId }: Props) {
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

  function openEdit(user: UserItem) {
    const dept = getUserDepartment(user);
    setEditId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      departmentId: dept?.id ?? "",
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("İsim ve e-posta zorunludur.");
      return;
    }
    if (!editId && !form.password) {
      setError("Yeni kullanıcı için şifre zorunludur.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (editId) {
        await updateUser(editId, {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password || undefined,
          role: form.role,
          departmentId: form.departmentId || null,
        });
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          departmentId: form.departmentId || null,
        });
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" kullanıcısını silmek istiyor musunuz?`)) return;
    try {
      await deleteUser(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users.length} kullanıcı</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={14} />
          Kullanıcı Ekle
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {users.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">Henüz kullanıcı yok.</p>
        )}
        {users.map((user) => {
          const dept = getUserDepartment(user);
          const isCurrentUser = user.id === currentUserId;
          return (
            <div key={user.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    user.role === "ADMIN" ? "bg-red-100" : "bg-blue-100"
                  }`}
                >
                  {user.role === "ADMIN" ? (
                    <Shield size={14} className="text-red-600" />
                  ) : (
                    <User size={14} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                    {isCurrentUser && (
                      <span className="text-xs text-gray-400">(siz)</span>
                    )}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role === "ADMIN" ? "Yönetici" : "Bölüm Başkanı"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {dept && (
                    <p className="text-xs text-gray-400 mt-0.5">{dept.name}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(user)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Düzenle"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(user.id, user.name)}
                  disabled={isCurrentUser}
                  className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={isCurrentUser ? "Kendinizi silemezsiniz" : "Sil"}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold">
                {editId ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="Dr. Ahmet Yılmaz"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="ahmet.yilmaz@amasya.edu.tr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre {editId && <span className="font-normal text-gray-400">(boş bırakılırsa değişmez)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder={editId ? "Değiştirmek için yazınız" : "En az 6 karakter"}
                  required={!editId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, role: e.target.value as "ADMIN" | "DEPT_HEAD" }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                >
                  <option value="DEPT_HEAD">Bölüm Başkanı</option>
                  <option value="ADMIN">Yönetici (Admin)</option>
                </select>
              </div>

              {form.role === "DEPT_HEAD" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bölüm
                  </label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  >
                    <option value="">Seçiniz...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
