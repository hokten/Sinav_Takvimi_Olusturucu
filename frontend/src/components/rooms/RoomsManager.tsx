"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { createRoom, updateRoom, deleteRoom } from "@/app/actions/rooms";
import { roomSchema } from "@/lib/validations";

interface Room {
  id: string;
  name: string;
  capacity: number;
}

interface Props {
  rooms: Room[];
  onRefresh?: () => void;
}

export function RoomsManager({ rooms, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openAdd() {
    setEditId(null);
    setName("");
    setCapacity(0);
    setError("");
    setShowForm(true);
  }

  function openEdit(room: Room) {
    setEditId(room.id);
    setName(room.name);
    setCapacity(room.capacity);
    setError("");
    setShowForm(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      capacity: Number(capacity)
    };

    const validation = roomSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (editId) {
        await updateRoom(editId, validation.data);
      } else {
        await createRoom({ name: name.trim(), capacity });
      }
      setShowForm(false);
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, roomName: string) {
    if (!confirm(`"${roomName}" salonunu silmek istiyor musunuz?`)) return;
    try {
      await deleteRoom(id);
      onRefresh?.();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Hata oluştu.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{rooms.length} derslik</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={14} />
          Derslik Ekle
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {rooms.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">Henüz derslik eklenmemiş.</p>
        )}
        {rooms.map((room) => (
          <div key={room.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900 text-sm">{room.name}</p>
              {room.capacity > 0 ? (
                <p className="text-xs text-gray-500">{room.capacity} kişilik</p>
              ) : (
                <p className="text-xs text-gray-400">Kapasite belirtilmemiş</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(room)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Düzenle"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(room.id, room.name)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Sil"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold">
                {editId ? "Derslik Düzenle" : "Yeni Derslik"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Derslik Adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="A-306"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapasite (kişi)
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="0 (belirtilmemiş)"
                  min={0}
                />
                <p className="text-xs text-gray-400 mt-1">0 girerseniz kapasite belirtilmemiş sayılır.</p>
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
