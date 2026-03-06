import { useState, useEffect } from "react";
import {
  Home,
  ClipboardList,
  Settings,
  Plus,
  ShieldCheck,
  Users,
  Building2,
  Wrench,
  Phone,
  User,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const tenantNavItems = [
  { title: "Home", url: "/tenant-dashboard", icon: Home },
  { title: "Requests", url: "/my-requests", icon: ClipboardList },
  { title: "Contact", url: "/contact", icon: Phone },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminNavItems = [
  { title: "Admin", url: "/admin", icon: ShieldCheck },
  { title: "Vendors", url: "/vendors", icon: Wrench },
  { title: "Tenants", url: "/tenants", icon: Users },
  { title: "Properties", url: "/properties", icon: Building2 },
];

const vendorNavItems = [
  { title: "Vendor", url: "/vendor", icon: Wrench },
  { title: "Profile", url: "/vendor/profile", icon: User },
  { title: "Contact", url: "/contact", icon: Phone },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsVendor(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (data) {
        setIsAdmin(data.some((r) => r.role === "admin"));
        setIsVendor(data.some((r) => r.role === "vendor"));
      }
    };

    checkRoles();
  }, [user]);

  const allNavItems = isAdmin
    ? adminNavItems
    : isVendor
    ? vendorNavItems
    : tenantNavItems;

  const isActive = (path: string) => location.pathname === path;
  const showFab = !isAdmin && !isVendor;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-elevated z-50 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {allNavItems.map((item) => (
          <button
            key={item.title}
            onClick={() => navigate(item.url)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200",
              isActive(item.url)
                ? "text-primary"
                : "text-muted-foreground active:scale-95"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-colors",
                isActive(item.url) && "bg-primary/10"
              )}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">{item.title}</span>
          </button>
        ))}

        {showFab && (
          <button
            onClick={() => navigate("/maintenance-request")}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-card active:scale-95 transition-transform">
              <Plus className="h-5 w-5" />
            </div>
          </button>
        )}
      </div>
    </nav>
  );
}