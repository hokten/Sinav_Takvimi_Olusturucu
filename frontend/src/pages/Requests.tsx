import { useEffect, useState } from "react";
import axios from "axios";
import { RequestsManager } from "@/components/requests/RequestsManager";
import { useAuth } from "@/contexts/AuthContext";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [scheduleDays, setScheduleDays] = useState<any[]>([]);
  const [userOwnedRoomIds, setUserOwnedRoomIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const session = user ? { user } : null;

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      axios.get("/requests"),
      axios.get("/rooms"),
      axios.get("/sessions"),
      axios.get("/room-assignments")
    ])
      .then(([reqRes, roomRes, sessRes, asgRes]) => {
        setRequests(reqRes.data);
        setRooms(roomRes.data);
        setScheduleDays(sessRes.data);
        
        const assignments = asgRes.data;
        const myPrograms = session?.user?.programIds || [];
        const owned = assignments
          .filter((a: any) => myPrograms.includes(a.programId))
          .map((a: any) => a.roomId);
        setUserOwnedRoomIds(owned);
        
        setError("");
      })
      .catch((err) => {
        setError(err.message);
        if (err.response?.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [session, logout]);

  if (error) return <div className="p-8 text-red-500 bg-red-50 border border-red-200 rounded-md">Error: {error}</div>;
  if (loading && requests.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Talepler Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Oturum Talepleri</h1>
        <p className="text-sm text-gray-500 mt-1">Başka programların salonlarını sınav için talep edin ve tarafınıza gelen talepleri onaylayın.</p>
      </div>
      <RequestsManager 
        requests={requests} 
        rooms={rooms} 
        scheduleDays={scheduleDays} 
        session={session as any}
        userPrograms={session?.user?.programs || []}
        userProgramIds={session?.user?.programIds || []}
        userOwnedRoomIds={userOwnedRoomIds}
      />
    </div>
  );
}
