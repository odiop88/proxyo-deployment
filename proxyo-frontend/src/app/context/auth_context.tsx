/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { logout as logoutApi } from "../services/auth_api";

// ── Types ──────────────────────────────────────────────────
interface UserInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
  company_id?: number;
  company_status?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// ── Init localStorage synchrone ────────────────────────────
function getInitialUser(): UserInfo | null {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    // Merge company_status depuis le localStorage company si absent
    if (!user.company_status) {
      const company = localStorage.getItem("company");
      if (company) user.company_status = JSON.parse(company).status;
    }
    return user;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

// ── Context ────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(getInitialUser);

  const handleSetUser = (u: UserInfo | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
    } else {
      localStorage.removeItem("user");
    }
  };

  const logout = () => {
    logoutApi();
    handleSetUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser: handleSetUser,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────avec useContext
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}