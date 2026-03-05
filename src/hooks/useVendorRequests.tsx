import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface VendorMaintenanceRequest {
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
  vendor_user_id: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
  tenant_name?: string;
  tenant_email?: string;
}

export const useVendorRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VendorMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);

  const checkVendorRole = async () => {
    if (!user) return false;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "vendor")
      .maybeSingle();

    if (error) {
      console.error("Error checking vendor role:", error);
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
      const vendorCheck = await checkVendorRole();
      setIsVendor(vendorCheck);

      if (!vendorCheck) {
        setLoading(false);
        return;
      }

      // Fetch requests assigned to this vendor (RLS will filter automatically)
      const { data: requestsData, error: requestsError } = await supabase
        .from("maintenance_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch profiles for tenant names
      const userIds = [...new Set((requestsData || []).map((r) => r.user_id))];
      
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;
        profilesData = profiles || [];
      }

      const requestsWithTenants = (requestsData || []).map((request) => {
        const profile = profilesData.find((p) => p.user_id === request.user_id);
        return {
          ...request,
          tenant_name: profile?.full_name || "Unknown Tenant",
          tenant_email: profile?.email || "",
        };
      });

      setRequests(requestsWithTenants);
    } catch (error) {
      console.error("Error fetching vendor requests:", error);
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
      const { error } = await supabase
        .from("maintenance_requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) throw error;

      await supabase.from("request_updates").insert({
        request_id: requestId,
        update_type: "status_change",
        message: `Status changed to ${newStatus}`,
        author: "Vendor",
      });

      toast.success(`Request marked as ${newStatus}`);
      await fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    }
  };

  return {
    requests,
    loading,
    isVendor,
    updateRequestStatus,
    refetch: fetchRequests,
  };
};
