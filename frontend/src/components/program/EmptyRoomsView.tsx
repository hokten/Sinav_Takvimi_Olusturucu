"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface Room { id: string; name: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Exam {
  id: string;
  date: string;
  time: string;
  roomIds: string[];
}

interface Props {
  scheduleDays: ScheduleDay[];
  rooms: Room[];
  exams: Exam[];
}

export function EmptyRoomsView({ scheduleDays, rooms, exams }: Props) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const selectedDay = scheduleDays.find((d) => d.date === selectedDate);
  const availableTimes = selectedDay ? [...selectedDay.sessions].sort() : [];

  function getEmptyRooms(date: string, time: string): Room[] {
    const busyRoomIds = new Set(
      exams
        .filter((e) => e.date === date && e.time === time)
        .flatMap((e) => e.roomIds)
    );
    return rooms.filter((r) => !busyRoomIds.has(r.id));
  }

  function getBusyRooms(date: string, time: string): Room[] {
    const busyRoomIds = new Set(
      exams
        .filter((e) => e.date === date && e.time === time)
        .flatMap((e) => e.roomIds)
    );
    return rooms.filter((r) => busyRoomIds.has(r.id));
  }

  const canSearch = selectedDate !== "" && selectedTime !== "";
  const emptyRooms = canSearch ? getEmptyRooms(selectedDate, selectedTime) : [];
  const busyRooms = canSearch ? getBusyRooms(selectedDate, selectedTime) : [];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <select
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Tarih seçin —</option>
              {scheduleDays.map((day) => (
                <option key={day.id} value={day.date}>
                  {day.date}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oturum Saati</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!selectedDate || availableTimes.length === 0}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">— Saat seçin —</option>
              {availableTimes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedDate && availableTimes.length === 0 && (
          <p className="text-xs text-amber-600">Bu güne tanımlı oturum bulunmuyor.</p>
        )}
      </div>

      {/* Results */}
      {canSearch && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Search size={14} />
            <span>
              <strong>{selectedDate}</strong> — <strong>{selectedTime}</strong> oturumu sonuçları:
              <span className="ml-2 text-green-700 font-medium">{emptyRooms.length} boş</span>
              <span className="mx-1 text-gray-400">/</span>
              <span className="text-red-600 font-medium">{busyRooms.length} dolu</span>
              <span className="mx-1 text-gray-400">/</span>
              <span className="text-gray-500">{rooms.length} toplam salon</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Empty rooms */}
            <div className="bg-white rounded-lg border border-green-200">
              <div className="px-4 py-3 border-b border-green-200 bg-green-50 rounded-t-lg">
                <h3 className="text-sm font-semibold text-green-800">
                  Boş Salonlar ({emptyRooms.length})
                </h3>
              </div>
              <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
                {emptyRooms.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">Bu saatte tüm salonlar dolu.</p>
                ) : (
                  emptyRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 border border-green-100"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-green-900">{room.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Busy rooms */}
            <div className="bg-white rounded-lg border border-red-200">
              <div className="px-4 py-3 border-b border-red-200 bg-red-50 rounded-t-lg">
                <h3 className="text-sm font-semibold text-red-800">
                  Dolu Salonlar ({busyRooms.length})
                </h3>
              </div>
              <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
                {busyRooms.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">Bu saatte tüm salonlar boş.</p>
                ) : (
                  busyRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-100"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-red-900">{room.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!canSearch && (
        <div className="text-center py-12 text-gray-400">
          <Search size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Tarih ve oturum saati seçerek boş salonları görüntüleyin.</p>
        </div>
      )}
    </div>
  );
}
