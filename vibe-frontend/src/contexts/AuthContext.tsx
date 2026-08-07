import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { fetchProfile } from "@/api/profile";
import { queryClient } from "../queryClient";

/* =====================
   TYPES
===================== */
interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string; // ✅ ADD THIS
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    name: string,
    username: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

import { API_BASE_URL } from "../config";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = API_BASE_URL;

/* =====================
   PROVIDER
===================== */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("vibe_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("vibe_token");
  });

  const [loading, setLoading] = useState(true);

  /* =====================
     AUTO FETCH PROFILE
  ===================== */
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchProfile(token);

        setUser({
          id: profile.id ?? profile._id,
          username: profile.username,
          name: profile.name,
          email: profile.email ?? "",
          avatar: profile.avatar || "",
        });
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem("vibe_user");
        localStorage.removeItem("vibe_token");
        queryClient.clear();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  /* =====================
     LOGIN
  ===================== */
  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const userData: User = {
        id: data._id,
        username: data.username,
        name: data.name,
        email: data.email,
        avatar: data.avatar || "",
      };

      queryClient.clear();
      setUser(userData);
      setToken(data.token);

      localStorage.setItem("vibe_user", JSON.stringify(userData));
      localStorage.setItem("vibe_token", data.token);

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  /* =====================
     SIGNUP (FIXED)
  ===================== */
  const signup = async (
    name: string,
    username: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const userData: User = {
        id: data._id,
        username: data.username,
        name: data.name,
        email: data.email,
        avatar: data.avatar || "",
      };

      queryClient.clear();
      setUser(userData);
      setToken(data.token);

      localStorage.setItem("vibe_user", JSON.stringify(userData));
      localStorage.setItem("vibe_token", data.token);

      return true;
    } catch (error) {
      console.error("Signup failed:", error);
      return false;
    }
  };

  /* =====================
     LOGOUT
  ===================== */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("vibe_user");
    localStorage.removeItem("vibe_token");
    queryClient.clear();
  };

  /* =====================
     UPDATE USER
  ===================== */
  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedUser };
      localStorage.setItem("vibe_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =====================
   HOOK
===================== */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
