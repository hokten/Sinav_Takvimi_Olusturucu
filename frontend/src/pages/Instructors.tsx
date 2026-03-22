import { useEffect, useState } from "react";
import axios from "axios";
import { InstructorsManager } from "@/components/instructors/InstructorsManager";
import { useAuth } from "@/contexts/AuthContext";

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get("/instructors"),
      axios.get("/programs")
    ])
      .then(([instRes, progRes]) => {
        setInstructors(instRes.data);
        setPrograms(progRes.data);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
        if (err.response?.status === 401) logout();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [logout]);

  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 border border-red-200 rounded-md">Error: {error}</div>;
  if (loading && instructors.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Öğretim Elemanları Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Öğretim Elemanları</h1>
        <p className="text-sm text-gray-500 mt-1">Gözetmenlik ve ders sorumlulukları için öğretim elemanlarını yönetin.</p>
      </div>
      <InstructorsManager instructors={instructors} programs={programs} onRefresh={fetchData} />
    </div>
  );
}
