import { useState, useEffect } from "react";
import {
  Home,
  ClipboardList,
  Settings,
  LogOut,
  ShieldCheck,
  Users,
  Building2,
  Wrench,
  User,
  Sliders,
  Shield,
  Phone,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/ui/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const tenantNavItems = [
  { title: "Dashboard", url: "/tenant-dashboard", icon: Home },
  { title: "My Requests", url: "/my-requests", icon: ClipboardList },
  { title: "Contact", url: "/contact", icon: Phone },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminNavItems = [
  { title: "Admin", url: "/admin", icon: ShieldCheck },
  { title: "Admin Settings", url: "/admin/settings", icon: Sliders },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: Shield },
  { title: "Vendors", url: "/vendors", icon: Wrench },
  { title: "Tenants", url: "/tenants", icon: Users },
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Contact", url: "/contact", icon: Phone },
  { title: "Settings", url: "/settings", icon: Settings },
];

const vendorNavItems = [
  { title: "Vendor Dashboard", url: "/vendor", icon: Wrench },
  { title: "My Profile", url: "/vendor/profile", icon: User },
  { title: "Contact", url: "/contact", icon: Phone },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
          ) : (
            <Logo size="sm" className="shrink-0" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={`cursor-pointer transition-all duration-200 ${
                      isActive(item.url)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "text-sidebar-foreground hover:bg-secondary hover:text-secondary-foreground"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 ${isActive(item.url) ? "text-primary-foreground" : ""}`}
                    />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!isCollapsed && user && (
          <div className="mb-2 px-2 text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign out"
              className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}