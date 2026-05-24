import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth_context";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.company_status === "pending") return <Navigate to="/" replace />;

  return <>{children}</>;
}
