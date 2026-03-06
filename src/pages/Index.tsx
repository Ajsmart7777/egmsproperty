import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ArrowRight,
  Building2,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceRequests } from "@/hooks/useMaintenanceRequests";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "@/components/ui/Logo";
import RequestStatsChart from "@/components/dashboard/RequestStatsChart";
import RequestBarChart from "@/components/dashboard/RequestBarChart";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests, loading } = useMaintenanceRequests();
  const isMobile = useIsMobile();

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      {/* Header - Only show on mobile */}
      {isMobile && (
        <header className="bg-primary px-4 sm:px-6 pt-8 pb-6 rounded-b-[2rem] shadow-elevated">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Logo size="lg" />
            </div>
            <p className="text-primary-foreground/90 text-sm leading-relaxed">
              Welcome back, {user?.email?.split("@")[0] || "User"}! Manage your
              property maintenance requests easily.
            </p>
          </div>
        </header>
      )}

      {/* Desktop Welcome */}
      {!isMobile && (
        <div className="px-6 lg:px-8 pt-6">
          <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Welcome back, {user?.email?.split("@")[0] || "User"}!
            </h1>
            <p className="text-muted-foreground">
              Manage your property maintenance requests easily.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Maintenance Request Card */}
            <button
              onClick={() => navigate("/maintenance-request")}
              className="w-full rounded-2xl bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-brand-light shrink-0">
                  <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Submit Maintenance Request
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                    Report issues in your property
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </button>

            {/* My Requests Card */}
            <button
              onClick={() => navigate("/my-requests")}
              className="w-full rounded-2xl bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-brand-accent/20 shrink-0">
                  <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-brand-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    View My Requests
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                    Track your submitted requests
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </button>

            {/* Emergency Maintenance Card */}
            <button
              onClick={() => navigate("/emergency-maintenance")}
              className="w-full rounded-2xl bg-card p-4 sm:p-5 shadow-card border border-red-100 transition-all hover:shadow-elevated hover:-translate-y-0.5 active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-red-100 shrink-0">
                  <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Emergency Maintenance
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Report urgent issues that need immediate attention
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </button>

            {/* Help Center Card */}
            <button
              onClick={() => navigate("/help-support")}
              className="w-full rounded-2xl bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5 active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-brand-light shrink-0">
                  <HelpCircle className="h-6 w-6 sm:h-7 sm:w-7 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Help Center
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Read quick support guides and maintenance tips
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-xl bg-card p-3 sm:p-4 shadow-soft text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-primary">
                {loading ? "-" : stats.pending}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Pending
              </p>
            </div>
            <div className="rounded-xl bg-card p-3 sm:p-4 shadow-soft text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">
                {loading ? "-" : stats.inProgress}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                In Progress
              </p>
            </div>
            <div className="rounded-xl bg-card p-3 sm:p-4 shadow-soft text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-accent">
                {loading ? "-" : stats.completed}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Completed
              </p>
            </div>
          </div>

          {/* Dashboard Charts */}
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-brand-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                Request Overview
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-card p-4 sm:p-5 shadow-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Distribution
                </h3>
                {loading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      Loading...
                    </div>
                  </div>
                ) : (
                  <RequestStatsChart
                    pending={stats.pending}
                    inProgress={stats.inProgress}
                    completed={stats.completed}
                  />
                )}
              </div>
              <div className="rounded-2xl bg-card p-4 sm:p-5 shadow-card">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  By Status
                </h3>
                {loading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      Loading...
                    </div>
                  </div>
                ) : (
                  <RequestBarChart
                    pending={stats.pending}
                    inProgress={stats.inProgress}
                    completed={stats.completed}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="p-4 sm:p-6 lg:p-8 pt-0">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate("/maintenance-request")}
            className="w-full sm:w-auto sm:min-w-[280px] sm:mx-auto sm:flex h-12 sm:h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-card hover:bg-secondary transition-colors active:scale-[0.98]"
          >
            New Maintenance Request
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;