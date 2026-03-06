import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface AdminMaintenanceRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  building: string;
  apartment: string;
  issue_type: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
  tenant_name?: string;
  tenant_email?: string;
}

const normalizeStatus = (status: string) => {
  const value = status.trim().toLowerCase();

  if (value === "in_progress" || value === "in progress") {
    return "in-progress";
  }

  if (value === "pending") {
    return "pending";
  }

  if (value === "completed") {
    return "completed";
  }

  return value;
};

const formatStatusLabel = (status: string) => {
  const normalized = normalizeStatus(status);

  if (normalized === "in-progress") return "in progress";
  return normalized;
};

export const useAdminRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdminMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async () => {
    if (!user) return false;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.error("Error checking admin role:", error);
      return false;
    }

    return !!data;
  };

  const fetchRequests = async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      const adminCheck = await checkAdminRole();
      setIsAdmin(adminCheck);

      if (!adminCheck) {
        setLoading(false);
        return;
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from("maintenance_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");

      if (profilesError) throw profilesError;

      const requestsWithTenants = (requestsData || []).map((request) => {
        const profile = profilesData?.find((p) => p.user_id === request.user_id);
        return {
          ...request,
          status: normalizeStatus(request.status),
          tenant_name: profile?.full_name || "Unknown Tenant",
          tenant_email: profile?.email || "",
        };
      });

      setRequests(requestsWithTenants);
    } catch (error) {
      console.error("Error fetching admin requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const normalizedStatus = normalizeStatus(newStatus);

      const { error } = await supabase
        .from("maintenance_requests")
        .update({ status: normalizedStatus })
        .eq("id", requestId);

      if (error) throw error;

      await supabase.from("request_updates").insert({
        request_id: requestId,
        update_type: "status_change",
        message: `Status changed to ${formatStatusLabel(normalizedStatus)}`,
        author: "Admin",
      });

      toast.success(`Request marked as ${formatStatusLabel(normalizedStatus)}`);
      await fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    }
  };

  const bulkUpdateStatus = async (requestIds: string[], newStatus: string) => {
    try {
      const normalizedStatus = normalizeStatus(newStatus);

      const { error } = await supabase
        .from("maintenance_requests")
        .update({ status: normalizedStatus })
        .in("id", requestIds);

      if (error) throw error;

      const updateEntries = requestIds.map((id) => ({
        request_id: id,
        update_type: "status_change",
        message: `Status changed to ${formatStatusLabel(normalizedStatus)}`,
        author: "Admin",
      }));

      await supabase.from("request_updates").insert(updateEntries);

      toast.success(
        `${requestIds.length} requests marked as ${formatStatusLabel(normalizedStatus)}`
      );
      await fetchRequests();
    } catch (error) {
      console.error("Error bulk updating requests:", error);
      toast.error("Failed to update requests");
    }
  };

  const assignStaff = async (
    requestId: string,
    vendorUserId: string,
    vendorName: string
  ) => {
    try {
      const request = requests.find((r) => r.id === requestId);

      const { error } = await supabase
        .from("maintenance_requests")
        .update({
          assigned_to: vendorName,
          vendor_user_id: vendorUserId,
        })
        .eq("id", requestId);

      if (error) throw error;

      await supabase.from("request_updates").insert({
        request_id: requestId,
        update_type: "assignment",
        message: `Assigned to ${vendorName}`,
        author: "Admin",
      });

      if (request) {
        try {
          await supabase.functions.invoke("notify-vendor-assignment", {
            body: {
              vendorUserId,
              vendorName,
              requestId,
              requestTitle: request.title,
              issueType: request.issue_type,
              building: request.building,
              apartment: request.apartment,
              priority: request.priority,
            },
          });
        } catch (notifyError) {
          console.error("Error sending vendor notification:", notifyError);
        }
      }

      toast.success(`Request assigned to ${vendorName}`);
      await fetchRequests();
    } catch (error) {
      console.error("Error assigning staff:", error);
      toast.error("Failed to assign staff");
    }
  };

  return {
    requests,
    loading,
    isAdmin,
    updateRequestStatus,
    bulkUpdateStatus,
    assignStaff,
    refetch: fetchRequests,
  };
};