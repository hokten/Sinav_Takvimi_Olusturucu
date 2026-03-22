import { useEffect, useState } from "react";
import axios from "axios";
import { InstructorStatisticsView } from "@/components/program/InstructorStatisticsView";
import type { InstructorStat } from "@/components/program/InstructorStatisticsView";
import { Loader2, AlertCircle } from "lucide-react";

export default function InstructorStatisticsPage() {
  const [stats, setStats] = useState<InstructorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get<InstructorStat[]>("/instructors/stats")
      .then((res: any) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Stats fetching error:", err);
        setError("İstatistikler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Öğretim Elemanı İstatistikleri
      </h1>
      <InstructorStatisticsView stats={stats} />
    </div>
  );
}
