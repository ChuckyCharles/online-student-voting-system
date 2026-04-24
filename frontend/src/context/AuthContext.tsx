import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthUser { 
  name: string; 
  role: string; 
  school_id?: string;
  department_id?: string;
  course_id?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (token: string, role: string, name: string, school_id?: string, department_id?: string, course_id?: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem("user");
  const [user, setUser] = useState<AuthUser | null>(stored ? JSON.parse(stored) : null);

  function login(token: string, role: string, name: string, school_id?: string, department_id?: string, course_id?: string) {
    const userData = { name, role, school_id, department_id, course_id };
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  function updateUser(updates: Partial<AuthUser>) {
    const updated = { ...user, ...updates } as AuthUser;
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  }

  return <Ctx.Provider value={{ user, login, logout, updateUser }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);