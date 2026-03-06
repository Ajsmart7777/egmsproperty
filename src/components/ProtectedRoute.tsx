import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  allow?: Array<"tenant" | "admin" | "vendor">;
}

const ProtectedRoute = ({ children, allow }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [userRole, setUserRole] = useState<"tenant" | "admin" | "vendor" | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (loading) return;

      if (!user) {
        setUserRole(null);
        setCheckingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error checking role:", error);
        setUserRole("tenant");
        setCheckingRole(false);
        return;
      }

      const isAdmin = data?.some((r) => r.role === "admin");
      const isVendor = data?.some((r) => r.role === "vendor");

      if (isAdmin) {
        setUserRole("admin");
      } else if (isVendor) {
        setUserRole("vendor");
      } else {
        setUserRole("tenant");
      }

      setCheckingRole(false);
    };

    checkRole();
  }, [user, loading]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allow && (!userRole || !allow.includes(userRole))) {
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    }

    if (userRole === "vendor") {
      return <Navigate to="/vendor" replace />;
    }

    return <Navigate to="/tenant-dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;