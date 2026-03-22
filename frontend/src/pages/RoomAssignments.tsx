import { useEffect, useState } from "react";
import axios from "axios";
import { RoomAssignmentsManager } from "@/components/room-assignments/RoomAssignmentsManager";
import { useAuth } from "@/contexts/AuthContext";

export default function RoomAssignmentsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get("/rooms"),
      axios.get("/programs"),
      axios.get("/room-assignments")
    ])
      .then(([rmRes, progRes, asgRes]) => {
        setRooms(rmRes.data);
        setPrograms(progRes.data);
        setAssignments(asgRes.data);
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
  if (loading && rooms.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Atamalar Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sınıf Kullanım İzinleri</h1>
        <p className="text-sm text-gray-500 mt-1">Hangi programın hangi sınıfları sınav için kullanabileceğini işaretleyin.</p>
      </div>
      <RoomAssignmentsManager 
        rooms={rooms} 
        programs={programs} 
        assignments={assignments}
        onRefresh={fetchData} 
      />
    </div>
  );
}
