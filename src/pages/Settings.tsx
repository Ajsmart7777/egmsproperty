import { useNavigate } from "react-router-dom";
import { User, Bell, Shield, HelpCircle, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import MobileHeader from "@/components/ui/MobileHeader";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const settingsItems = [
    {
      icon: User,
      title: "Profile",
      description: "Manage your account details",
      onClick: () => navigate("/profile"),
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure notification preferences",
      onClick: () => navigate("/profile"),
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Manage your privacy settings",
      onClick: () => navigate("/privacy-security"),
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      description: "Get help with your account",
      onClick: () => navigate("/help-support"),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      {isMobile && (
        <MobileHeader
          title="Settings"
          onBack={() => navigate("/")}
        />
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {!isMobile && (
            <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
          )}

          {/* User Info Card */}
          <div 
            className="rounded-2xl bg-card p-4 sm:p-5 shadow-card mb-6 cursor-pointer transition-all hover:shadow-elevated hover:-translate-y-0.5"
            onClick={() => navigate("/profile")}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-xl shadow-card">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {user?.email?.split("@")[0] || "User"}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-primary mt-1">View profile</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Settings Items */}
          <div className="space-y-2">
            {settingsItems.map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className="w-full rounded-xl bg-card p-4 shadow-soft transition-all hover:shadow-card hover:-translate-y-0.5 active:scale-[0.98] text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            ))}
          </div>

          {/* Sign Out Button */}
          <div className="mt-8">
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl bg-destructive/10 p-4 text-destructive font-medium transition-all hover:bg-destructive/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
