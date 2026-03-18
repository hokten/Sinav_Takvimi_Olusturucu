"use client";

import type { Session } from "next-auth";
import { deleteExam } from "@/app/actions/exams";

interface Department { id: string; name: string; color: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string; mainDeptId: string }
interface Course { id: string; code: string; name: string; section: number; grade: number; instructorId: string; departmentId: string; adminOnly: boolean; instructor: Instructor }
interface Room { id: string; name: string }
interface Exam {
  id: string;
  courseId: string;
  date: string;
  time: string;
  roomIds: string[];
  supervisorIds: string[];
  instructorId: string;
  departmentId: string;
  course: Course;
  instructor: Instructor;
  department: Department;
}

interface Props {
  department: Department;
  scheduleDays: ScheduleDay[];
  exams: Exam[];
  rooms: Room[];
  session: Session;
  onEdit: (exam: Exam) => void;
}

const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function getDayName(dateStr: string): string {
  return DAYS_TR[parseDate(dateStr).getDay()];
}

function isBeforeNoon(time: string): boolean {
  const [h] = time.split(":").map(Number);
  return h < 12;
}

export function ExamTable({ department, scheduleDays, exams, rooms, session, onEdit }: Props) {
  const isAdmin = session.user.role === "ADMIN";
  const canEdit = isAdmin || session.user.departmentId === department.id;

  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r.name]));

  // Group exams by date+time
  const examsByDatetime = new Map<string, Exam[]>();
  for (const exam of exams) {
    const key = `${exam.date}|${exam.time}`;
    if (!examsByDatetime.has(key)) examsByDatetime.set(key, []);
    examsByDatetime.get(key)!.push(exam);
  }

  // Build rows per day
  type Row =
    | { type: "exam"; date: string; time: string; exam: Exam; dayRowspan?: number }
    | { type: "lunch"; date: string }
    | { type: "empty-day"; date: string };

  const allRows: Row[] = [];

  for (const day of scheduleDays) {
    const dayExams = exams
      .filter((e) => e.date === day.date)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (dayExams.length === 0) {
      allRows.push({ type: "empty-day", date: day.date });
      continue;
    }

    const morningExams = dayExams.filter((e) => isBeforeNoon(e.time));
    const afternoonExams = dayExams.filter((e) => !isBeforeNoon(e.time));

    let firstRow = true;
    for (const exam of morningExams) {
      allRows.push({
        type: "exam",
        date: day.date,
        time: exam.time,
        exam,
        dayRowspan: firstRow ? dayExams.length + (morningExams.length > 0 && afternoonExams.length > 0 ? 1 : 0) : undefined,
      });
      firstRow = false;
    }

    if (morningExams.length > 0 && afternoonExams.length > 0) {
      allRows.push({ type: "lunch", date: day.date });
    }

    for (const exam of afternoonExams) {
      allRows.push({
        type: "exam",
        date: day.date,
        time: exam.time,
        exam,
        dayRowspan: firstRow ? dayExams.length + 1 : undefined,
      });
      firstRow = false;
    }
  }

  async function handleDelete(examId: string) {
    if (!confirm("Bu sınavı silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteExam(examId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Hata oluştu.");
    }
  }

  return (
    <div className="bg-white" id="print-document">
      {/* Document Header */}
      <div className="text-center py-4 border-b border-black" style={{ printColorAdjust: "exact" }}>
        <p className="text-sm font-medium">T.C.</p>
        <p className="text-sm font-medium">AMASYA ÜNİVERSİTESİ</p>
        <p className="text-sm">Amasya Teknik Bilimler Meslek Yüksekokulu</p>
        <p className="text-sm font-semibold mt-1">{department.name} Programı</p>
        <p className="text-sm mt-0.5">2024-2025 Eğitim-Öğretim Yılı Bahar Dönemi Final Sınav Takvimi</p>
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-xs" style={{ borderColor: "black" }}>
        <thead>
          <tr>
            {["Tarih", "Gün", "Saat", "Dersin Kodu", "Dersin Adı", "Dersin Öğretim Elemanı", "Derslik", "Görevli"].map(
              (h) => (
                <th
                  key={h}
                  className="border border-black bg-gray-100 px-2 py-1 text-center font-semibold"
                  style={{ borderColor: "black" }}
                >
                  {h}
                </th>
              )
            )}
            {canEdit && <th className="no-print border border-black bg-gray-100 px-2 py-1">İşlem</th>}
          </tr>
        </thead>
        <tbody>
          {scheduleDays.length === 0 ? (
            <tr>
              <td colSpan={canEdit ? 9 : 8} className="text-center py-8 text-gray-400 border border-black">
                Henüz sınav günü tanımlanmamış.
              </td>
            </tr>
          ) : (
            (() => {
              const rows: React.ReactNode[] = [];
              const seenDates = new Set<string>();

              for (let i = 0; i < allRows.length; i++) {
                const row = allRows[i];

                if (row.type === "lunch") {
                  rows.push(
                    <tr key={`lunch-${row.date}`}>
                      <td
                        colSpan={canEdit ? 9 : 8}
                        className="text-center py-1 font-medium text-gray-500 border border-black"
                        style={{ borderColor: "black" }}
                      >
                        ÖĞLE ARASI
                      </td>
                    </tr>
                  );
                  continue;
                }

                if (row.type === "empty-day") {
                  rows.push(
                    <tr key={`empty-${row.date}`}>
                      <td
                        className="border border-black px-1 text-center font-medium"
                        style={{
                          writingMode: "vertical-lr",
                          transform: "rotate(180deg)",
                          borderColor: "black",
                          minWidth: "30px",
                        }}
                      >
                        {row.date}
                      </td>
                      <td className="border border-black px-1 text-center" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", borderColor: "black" }}>
                        {getDayName(row.date)}
                      </td>
                      <td colSpan={canEdit ? 7 : 6} className="border border-black px-2 py-2 text-center text-gray-400" style={{ borderColor: "black" }}>
                        Bu gün için sınav planlanmamış
                      </td>
                    </tr>
                  );
                  continue;
                }

                // exam row
                const { exam, date, time } = row;
                const showDate = !seenDates.has(date);
                if (showDate) seenDates.add(date);

                // Count rows for this date for rowspan
                const dateRowCount = allRows.filter(
                  (r) => r.type !== "empty-day" && r.date === date
                ).length;

                rows.push(
                  <tr key={exam.id}>
                    {showDate && (
                      <td
                        rowSpan={dateRowCount}
                        className="border border-black px-1 text-center font-medium align-middle"
                        style={{
                          writingMode: "vertical-lr",
                          transform: "rotate(180deg)",
                          borderColor: "black",
                          minWidth: "30px",
                        }}
                      >
                        {date}
                      </td>
                    )}
                    {showDate && (
                      <td
                        rowSpan={dateRowCount}
                        className="border border-black px-1 text-center align-middle"
                        style={{
                          writingMode: "vertical-lr",
                          transform: "rotate(180deg)",
                          borderColor: "black",
                        }}
                      >
                        {getDayName(date)}
                      </td>
                    )}
                    <td className="border border-black px-2 py-1 text-center whitespace-nowrap" style={{ borderColor: "black" }}>
                      {time}
                    </td>
                    <td className="border border-black px-2 py-1 font-mono" style={{ borderColor: "black" }}>
                      {exam.course.code}
                    </td>
                    <td className="border border-black px-2 py-1" style={{ borderColor: "black" }}>
                      {exam.course.name}{" "}
                      <span className="text-gray-500 text-xs">Şb.{exam.course.section}</span>
                    </td>
                    <td className="border border-black px-2 py-1" style={{ borderColor: "black" }}>
                      {exam.instructor.name}
                    </td>
                    <td className="border border-black px-2 py-1 whitespace-nowrap" style={{ borderColor: "black" }}>
                      {exam.roomIds.map((rid) => roomMap[rid] ?? rid).join(" ")}
                    </td>
                    <td className="border border-black px-2 py-1" style={{ borderColor: "black" }}>
                      {exam.supervisorIds.map((sid, idx) => (
                        <div key={idx}>{sid}</div>
                      ))}
                    </td>
                    {canEdit && (
                      <td className="no-print border border-black px-2 py-1 whitespace-nowrap" style={{ borderColor: "black" }}>
                        {(isAdmin || (!exam.course.adminOnly && exam.departmentId === session.user.departmentId)) && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => onEdit(exam)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDelete(exam.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Sil
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              }

              return rows;
            })()
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-4 text-xs text-right pr-4">
        <p className="font-medium">{department.name} Bölüm Başkanı</p>
      </div>
    </div>
  );
}
