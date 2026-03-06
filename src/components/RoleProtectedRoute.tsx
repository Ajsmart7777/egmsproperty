import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allow: Array<"tenant" | "admin" | "vendor">;
}

const RoleProtectedRoute = ({ children, allow }: RoleProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [userRole, setUserRole] = useState<"tenant" | "admin" | "vendor" | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (loading) return;

      if (!user) {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userRole || !allow.includes(userRole)) {
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "vendor") return <Navigate to="/vendor" replace />;
    return <Navigate to="/tenant-dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;