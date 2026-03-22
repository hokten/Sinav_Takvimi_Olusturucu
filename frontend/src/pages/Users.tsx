import { useEffect, useState } from "react";
import axios from "axios";
import { UsersManager } from "@/components/users/UsersManager";
import { useAuth } from "@/contexts/AuthContext";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get("/users"),
      axios.get("/departments")
    ])
      .then(([usersRes, deptsRes]) => {
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
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
  if (loading && users.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Kullanıcılar Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">Sisteme erişimi olan yönetici ve bölüm başkanlarını yönetin.</p>
      </div>
      <UsersManager 
        users={users} 
        departments={departments} 
        currentUserId={user?.id || ""} 
        onRefresh={fetchData} 
      />
    </div>
  );
}
