import { useEffect, useState } from "react";
import axios from "axios";
import { SessionsManager } from "@/components/sessions/SessionsManager";
import { useAuth } from "@/contexts/AuthContext";

export default function SessionsPage() {
  const [scheduleDays, setScheduleDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  const fetchData = () => {
    setLoading(true);
    axios.get("/sessions")
      .then((res) => {
        setScheduleDays(res.data);
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
  if (loading && scheduleDays.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Takvim Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Oturum Saatleri (Takvim)</h1>
        <p className="text-sm text-gray-500 mt-1">Sınav yapılacak günleri ve bu günlere ait oturum saatlerini yönetin.</p>
      </div>
      <SessionsManager 
        scheduleDays={scheduleDays} 
        onRefresh={fetchData} 
      />
    </div>
  );
}
