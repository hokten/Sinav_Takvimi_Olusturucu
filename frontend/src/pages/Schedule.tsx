import { useEffect, useState } from "react";
import axios from "axios";
import { ScheduleDocument } from "@/components/schedule/ScheduleDocument";
import { useAuth } from "@/contexts/AuthContext";

export default function Schedule() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const { logout } = useAuth();

  useEffect(() => {
    axios.get("/schedule/data")
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.message);
        if (err.response?.status === 401) logout();
      });
  }, [logout]);

  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 border border-red-200 rounded-md">Error: {error}</div>;
  if (!data) return <div className="p-8 text-gray-500 animate-pulse">Sınav Programı Yükleniyor...</div>;

  return <ScheduleDocument {...data} />;
}
