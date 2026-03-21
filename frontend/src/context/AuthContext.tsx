import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthUser { name: string; role: string; }
interface AuthCtx {
  user: AuthUser | null;
  login: (token: string, role: string, name: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem("user");
  const [user, setUser] = useState<AuthUser | null>(stored ? JSON.parse(stored) : null);

  function login(token: string, role: string, name: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify({ name, role }));
    setUser({ name, role });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
