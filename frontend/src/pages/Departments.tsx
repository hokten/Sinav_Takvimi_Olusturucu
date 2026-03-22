import { useEffect, useState } from "react";
import axios from "axios";
import { DepartmentsManager } from "@/components/departments/DepartmentsManager";
import { useAuth } from "@/contexts/AuthContext";

export default function DepartmentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  const fetchData = () => {
    setLoading(true);
    axios.get("/departments")
      .then((res) => {
        setData(res.data);
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
  if (loading && data.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Bölümler Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bölümler ve Programlar</h1>
        <p className="text-sm text-gray-500 mt-1">Akademik birimleri ve alt programlarını buradan yönetebilirsiniz.</p>
      </div>
      <DepartmentsManager departments={data} onRefresh={fetchData} />
    </div>
  );
}
