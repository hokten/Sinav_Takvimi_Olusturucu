import { useEffect, useState } from "react";
import axios from "axios";
import { RoomsManager } from "@/components/rooms/RoomsManager";
import { useAuth } from "@/contexts/AuthContext";

export default function RoomsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  const fetchData = () => {
    setLoading(true);
    axios.get("/rooms")
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
  if (loading && data.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Derslikler Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Derslik Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">Sınav yapılacak tüm derslikleri buradan yönetebilirsiniz.</p>
      </div>
      <RoomsManager rooms={data} onRefresh={fetchData} />
    </div>
  );
}
