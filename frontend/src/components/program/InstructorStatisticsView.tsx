import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";

type SortKey = "name" | "examCount" | "supervisorCount" | "total";
type SortDir = "asc" | "desc";

export interface InstructorStat {
  id: string;
  name: string;
  mainProgramName: string;
  mainProgramColor: string;
  sideProgramNames: string[];
  examCount: number;
  supervisorCount: number;
}

interface Props {
  stats: InstructorStat[];
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={14} className="text-gray-400" />;
  return dir === "asc"
    ? <ChevronUp size={14} className="text-blue-600" />
    : <ChevronDown size={14} className="text-blue-600" />;
}

export function InstructorStatisticsView({ stats }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = stats.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;
    if (sortKey === "name") {
      aVal = a.name;
      bVal = b.name;
    } else if (sortKey === "examCount") {
      aVal = a.examCount;
      bVal = b.examCount;
    } else if (sortKey === "supervisorCount") {
      aVal = a.supervisorCount;
      bVal = b.supervisorCount;
    } else {
      aVal = a.examCount + a.supervisorCount;
      bVal = b.examCount + b.supervisorCount;
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const maxTotal = Math.max(...stats.map((s) => s.examCount + s.supervisorCount), 1);

  function ThHeader({
    label,
    sortable,
    className,
  }: {
    label: string;
    sortable?: SortKey;
    className?: string;
  }) {
    const active = sortable !== undefined && sortKey === sortable;
    return (
      <th
        className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${
          sortable ? "cursor-pointer select-none hover:bg-gray-100" : ""
        } ${className ?? ""}`}
        onClick={sortable ? () => handleSort(sortable) : undefined}
      >
        <div className="flex items-center gap-1">
          {label}
          {sortable && <SortIcon active={active} dir={sortDir} />}
        </div>
      </th>
    );
  }

  return (
    <div className="space-y-4">
      {/* Özet kartları */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Toplam Öğretim Elemanı</p>
          <p className="text-2xl font-bold text-gray-900">{stats.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Toplam Ders Sorumluluğu</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.reduce((s, i) => s + i.examCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Toplam Gözetim Görevi</p>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.reduce((s, i) => s + i.supervisorCount, 0)}
          </p>
        </div>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Öğretim elemanı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">
                #
              </th>
              <ThHeader label="Öğretim Elemanı" sortable="name" />
              <ThHeader label="Program" />
              <ThHeader label="Ders Sorumluluğu" sortable="examCount" className="text-center" />
              <ThHeader label="Gözetim Görevi" sortable="supervisorCount" className="text-center" />
              <ThHeader label="Toplam Görev" sortable="total" className="text-center" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">
                Dağılım
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  Öğretim elemanı bulunamadı.
                </td>
              </tr>
            )}
            {sorted.map((stat, idx) => {
              const total = stat.examCount + stat.supervisorCount;
              const barWidth = total > 0 ? Math.round((total / maxTotal) * 100) : 0;
              const examPct = total > 0 ? Math.round((stat.examCount / total) * 100) : 0;
              return (
                <tr key={stat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{stat.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span
                        className="inline-block max-w-[160px] truncate px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: stat.mainProgramColor }}
                        title={stat.mainProgramName}
                      >
                        {stat.mainProgramName}
                      </span>
                      {stat.sideProgramNames
                        .filter(Boolean)
                        .map((name) => (
                          <span
                            key={name}
                            className="inline-block max-w-[160px] truncate px-2 py-0.5 rounded text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300"
                            title={name}
                          >
                            {name}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm">
                      {stat.examCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-50 text-yellow-700 font-semibold text-sm">
                      {stat.supervisorCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold text-sm">
                      {total}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {total > 0 ? (
                      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full flex"
                          style={{ width: `${barWidth}%` }}
                        >
                          <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${examPct}%` }}
                            title={`Ders sorumluluğu: ${stat.examCount}`}
                          />
                          <div
                            className="bg-yellow-400 h-full flex-1"
                            title={`Gözetim: ${stat.supervisorCount}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-100 rounded-full h-4" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Açıklama */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Ders sorumluluğu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-400" />
          <span>Gözetim görevi</span>
        </div>
      </div>
    </div>
  );
}
