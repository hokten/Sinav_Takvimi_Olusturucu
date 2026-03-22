import { useEffect, useState } from "react";
import axios from "axios";
import { EmptyRoomsView } from "@/components/program/EmptyRoomsView";
import { useAuth } from "@/contexts/AuthContext";

export default function EmptyRoomsPage() {
  const [scheduleDays, setScheduleDays] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const session = user ? { user } : null;

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    // Reuse the fast /data endpoint
    axios.get("/schedule/data")
      .then((res) => {
        setScheduleDays(res.data.scheduleDays);
        setRooms(res.data.rooms);
        setExams(res.data.allExams);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
        if (err.response?.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [session, logout]);

  if (error) return <div className="p-8 text-red-500 bg-red-50 border border-red-200 rounded-md">Error: {error}</div>;
  if (loading && rooms.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Salonlar Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Boş Salon Bulucu</h1>
        <p className="text-sm text-gray-500 mb-6">Seçilen tarih ve oturumda hangi salonların boş olduğunu görün.</p>
      </div>
      <EmptyRoomsView scheduleDays={scheduleDays} rooms={rooms} exams={exams} />
    </div>
  );
}
