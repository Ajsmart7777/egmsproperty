import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminRequests } from "@/hooks/useAdminRequests";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminRequestsTable } from "@/components/admin/AdminRequestsTable";
import { AdminStatusChart } from "@/components/admin/AdminStatusChart";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { requests, loading, isAdmin, updateRequestStatus, bulkUpdateStatus, assignStaff } =
    useAdminRequests();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      inProgress: requests.filter((r) => r.status === "in_progress").length,
      completed: requests.filter((r) => r.status === "completed").length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        searchQuery === "" ||
        request.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.apartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || request.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requests, searchQuery, statusFilter, priorityFilter]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl shadow-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges to access this dashboard. Please contact
            your administrator if you believe this is an error.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <AdminHeader pendingCount={stats.pending} />

      <AdminStatsCards
        total={stats.total}
        pending={stats.pending}
        inProgress={stats.inProgress}
        completed={stats.completed}
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <AdminFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
          />
        </div>
        <div>
          <AdminStatusChart
            pending={stats.pending}
            inProgress={stats.inProgress}
            completed={stats.completed}
          />
        </div>
      </div>

      <AdminRequestsTable
        requests={filteredRequests}
        onUpdateStatus={updateRequestStatus}
        onBulkUpdateStatus={bulkUpdateStatus}
        onAssignStaff={assignStaff}
      />
    </div>
  );
};

export default AdminDashboard;