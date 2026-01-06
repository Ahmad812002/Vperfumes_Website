import { createContext, useContext, useEffect, useState } from "react";
import api from "@/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout",  { withCredentials: true });
    } catch {}
    setUser(null);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log("Auth, Fetching current user...");
        const res = await api.get("/user",  { withCredentials: true });
       
        setUser(res.data.user);
    } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
