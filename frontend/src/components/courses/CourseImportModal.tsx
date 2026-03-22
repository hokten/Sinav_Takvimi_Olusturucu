"use client";

import { useRef, useState } from "react";
import { X, Upload, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { importCourses, type ImportCourseRow } from "@/app/actions/courses";

interface Props {
  onClose: () => void;
  programs: { id: string; name: string }[];
  instructors: { id: string; name: string }[];
}

interface ParsedRow extends ImportCourseRow {
  rowNum: number;
  programMatch: boolean;
  programWillCreate: boolean;
  instrMatch: boolean;
  instrWillCreate: boolean;
  rowOk: boolean;
}

function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR").trim();
}

function formatInstructorName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return name.trim();
  const surname = words[words.length - 1].toLocaleUpperCase("tr-TR");
  const firstNames = words.slice(0, -1).map(
    (w) => w[0].toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR")
  );
  return [...firstNames, surname].join(" ");
}

function parseQuota(raw: unknown): number {
  const str = String(raw ?? "").trim();
  // Format: "45/999" → 45 (enrolled count), or just "45"
  if (str.includes("/")) {
    const enrolled = parseInt(str.split("/")[0], 10);
    return isNaN(enrolled) ? 30 : enrolled;
  }
  const n = parseInt(str, 10);
  return isNaN(n) ? 30 : n;
}

export function CourseImportModal({ onClose, programs, instructors }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const programNameSet = new Set(programs.map((p) => trLower(p.name)));
  const instrNameSet = new Set(instructors.map((i) => trLower(i.name)));

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setRows(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        if (raw.length === 0) {
          setParseError("Excel dosyası boş veya okunamadı.");
          return;
        }

        const parsed: ParsedRow[] = raw.map((row, idx) => {
          const get = (keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(row).find(
                (rk) => rk.toLowerCase().replace(/\s+/g, " ").trim().includes(k)
              );
              if (found) return String(row[found] ?? "").trim();
            }
            return "";
          };

          const section = parseInt(get(["şube"]), 10) || 1;
          const grade = parseInt(get(["sınıf"]), 10) || 1;
          const quota = parseQuota(get(["kontenjan"]));
          const parentDeptName = get(["bölüm"]);
          const programName = get(["program"]);
          const instrName = get(["öğretim", "sorumlu"]);

          const programMatch = programNameSet.has(trLower(programName));
          const programWillCreate = !programMatch && !!programName.trim();
          const rowOk = programMatch || programWillCreate;
          const instrMatch = instrNameSet.has(trLower(instrName));
          const instrWillCreate = !instrMatch && rowOk && !!instrName.trim();

          const formattedInstrName = instrName ? formatInstructorName(instrName) : instrName;

          return {
            rowNum: idx + 2,
            code: get(["ders kodu", "kod"]),
            name: get(["ders adı", "ders ad"]),
            section,
            grade,
            quota,
            parentDeptName,
            departmentName: programName,
            instructorName: formattedInstrName,
            programMatch,
            programWillCreate,
            instrMatch,
            instrWillCreate,
            rowOk,
          };
        });

        const valid = parsed.filter((r) => r.code && r.name);
        if (valid.length === 0) {
          setParseError(
            "Hiç geçerli satır bulunamadı. Sütun başlıkları kontrol edin: Şube No, Ders Kodu, Ders Adı, Sınıf, Kontenjan, Bölüm, Program, Dersi Sorumlu Öğretim Elemanı"
          );
          return;
        }

        setRows(valid);
      } catch {
        setParseError("Dosya okunamadı. Geçerli bir .xlsx veya .xls dosyası seçin.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (!rows) return;
    setLoading(true);
    try {
      const res = await importCourses(rows);
      setResult(res);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "İçe aktarma hatası.");
    } finally {
      setLoading(false);
    }
  }

  const unmatchedRows = rows?.filter((r) => !r.rowOk || (!r.instrMatch && !r.instrWillCreate)) ?? [];
  const willCreateRows = rows?.filter((r) => r.instrWillCreate || r.programWillCreate) ?? [];
  const validRows = rows?.filter((r) => r.rowOk && (r.instrMatch || r.instrWillCreate)) ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-green-600" />
            Excel&apos;den Ders İçe Aktar
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Result view */}
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3">
                <CheckCircle2 size={18} />
                <span className="font-medium">
                  {result.created} ders eklendi, {result.skipped} ders atlandı.
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-sm font-medium text-red-700">Hatalar:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">{e}</p>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Kapat
              </button>
            </div>
          ) : (
            <>
              {/* File picker */}
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Excel sütunları:{" "}
                  <span className="font-medium">Şube No, Ders Kodu, Ders Adı, Sınıf, Kontenjan, Bölüm, Program, Dersi Sorumlu Öğretim Elemanı</span>
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 w-full justify-center"
                >
                  <Upload size={16} />
                  Excel Dosyası Seç (.xlsx / .xls)
                </button>
              </div>

              {parseError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview */}
              {rows && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-700">{validRows.length}</span> ders aktarılacak
                      {willCreateRows.length > 0 && (
                        <span className="ml-2 text-blue-600">
                          · <span className="font-semibold">{willCreateRows.length}</span> kayıt otomatik oluşturulacak
                        </span>
                      )}
                      {unmatchedRows.length > 0 && (
                        <span className="ml-2 text-red-600">
                          · <span className="font-semibold">{unmatchedRows.length}</span> satırda eşleşme hatası
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Auto-create info */}
                  {willCreateRows.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 space-y-1">
                      <p className="text-xs font-semibold text-blue-800 mb-1">
                        Otomatik oluşturulacak kayıtlar:
                      </p>
                      {willCreateRows.map((r) => (
                        <p key={r.rowNum} className="text-xs text-blue-700">
                          Satır {r.rowNum}: {r.code}
                          {r.programWillCreate && (
                            <span> — &quot;{r.departmentName}&quot; programı &quot;{r.parentDeptName}&quot; altında oluşturulacak</span>
                          )}
                          {r.instrWillCreate && (
                            <span> — &quot;{r.instructorName}&quot; öğretim elemanı oluşturulacak</span>
                          )}
                        </p>
                      ))}
                      <p className="text-xs text-blue-600 mt-1">
                        * Öğretim elemanlarının ana programı, en çok ders girdikleri programa göre otomatik belirlenir.
                      </p>
                    </div>
                  )}

                  {/* Unmatched warnings */}
                  {unmatchedRows.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-1">
                      <p className="text-xs font-semibold text-amber-800 mb-1">
                        Eşleşmeyen satırlar atlanacak:
                      </p>
                      {unmatchedRows.map((r) => (
                        <p key={r.rowNum} className="text-xs text-amber-700">
                          Satır {r.rowNum}: {r.code} —{" "}
                          {!r.programMatch && !r.programWillCreate && `"${r.departmentName}" program adı boş`}
                          {r.rowOk && !r.instrMatch && !r.instrWillCreate && `"${r.instructorName}" öğretim elemanı bulunamadı`}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Preview table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-60">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-600">Kod</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-600">Ders Adı</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-600">Şb</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-600">Sınıf</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-600">Kont.</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-600">Bölüm</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-600">Program</th>
                            <th className="px-2 py-1.5 text-left font-medium text-gray-600">Öğretim Elemanı</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {rows.map((r) => (
                            <tr
                              key={`${r.rowNum}-${r.code}`}
                              className={
                                !r.rowOk || (!r.instrMatch && !r.instrWillCreate)
                                  ? "bg-red-50"
                                  : r.programWillCreate || r.instrWillCreate
                                  ? "bg-blue-50"
                                  : ""
                              }
                            >
                              <td className="px-2 py-1 font-mono">{r.code}</td>
                              <td className="px-2 py-1 max-w-[140px] truncate">{r.name}</td>
                              <td className="px-2 py-1">{r.section}</td>
                              <td className="px-2 py-1">{r.grade}</td>
                              <td className="px-2 py-1">{r.quota}</td>
                              <td className="px-2 py-1">
                                {r.parentDeptName}
                              </td>
                              <td className={`px-2 py-1 ${!r.programMatch && !r.programWillCreate ? "text-red-600 font-medium" : r.programWillCreate ? "text-blue-600 font-medium" : ""}`}>
                                {r.departmentName}
                                {r.programWillCreate && <span className="ml-1 text-blue-500">(yeni)</span>}
                              </td>
                              <td className={`px-2 py-1 ${!r.instrMatch && !r.instrWillCreate ? "text-red-600 font-medium" : r.instrWillCreate ? "text-blue-600 font-medium" : ""}`}>
                                {r.instructorName}
                                {r.instrWillCreate && <span className="ml-1 text-blue-500">(yeni)</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && rows && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={handleImport}
              disabled={loading || validRows.length === 0}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "İçe Aktarılıyor..." : `${validRows.length} Dersi İçe Aktar`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
