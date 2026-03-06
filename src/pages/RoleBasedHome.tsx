import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const RoleBasedHome = () => {
  const { user, loading } = useAuth();
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (loading) return;

      if (!user) {
        setTargetPath("/auth");
        setCheckingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error checking roles:", error);
        setTargetPath("/");
        setCheckingRole(false);
        return;
      }

      const isAdmin = data?.some((r) => r.role === "admin");
      const isVendor = data?.some((r) => r.role === "vendor");

      if (isAdmin) {
        setTargetPath("/admin");
      } else if (isVendor) {
        setTargetPath("/vendor");
      } else {
        setTargetPath("/tenant-dashboard");
      }

      setCheckingRole(false);
    };

    checkRole();
  }, [user, loading]);

  if (loading || checkingRole || !targetPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <Navigate to={targetPath} replace />;
};

export default RoleBasedHome;