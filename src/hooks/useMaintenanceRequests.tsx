import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface MaintenanceRequest {
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
}

export interface RequestComment {
  id: string;
  request_id: string;
  user_id: string;
  author: string;
  message: string | null;
  is_staff: boolean;
  commenter_role?: string | null;
  images: string[];
  created_at: string;
}

export interface RequestUpdate {
  id: string;
  request_id: string;
  update_type: string;
  message: string;
  author: string | null;
  created_at: string;
}

export const useMaintenanceRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const issueTypeToSpecialtyMap: Record<string, string> = {
    plumbing: "plumbing",
    electrical: "electrical",
    hvac: "hvac",
    "appliance repair": "appliance",
    painting: "painting",
    "pest control": "pest_control",
    bricklaying: "bricklaying",
    "ac/washing technician": "ac_washing",
    cleaning: "other",
    structural: "other",
    "alluminium technician": "other",
    others: "other",
  };

  const findMatchingVendor = async (issueType: string) => {
    const normalizedIssueType = issueType.toLowerCase();
    const matchingSpecialty =
      issueTypeToSpecialtyMap[normalizedIssueType] || "other";

    const { data: matchingVendorSpecialties } = await supabase
      .from("vendor_specialties")
      .select("user_id")
      .eq("specialty", matchingSpecialty);

    if (!matchingVendorSpecialties || matchingVendorSpecialties.length === 0) {
      return null;
    }

    const vendorUserIds = matchingVendorSpecialties.map((v) => v.user_id);

    const { data: vendorRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "vendor")
      .in("user_id", vendorUserIds);

    if (!vendorRoles || vendorRoles.length === 0) {
      return null;
    }

    const { data: vendorProfile } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("user_id", vendorRoles[0].user_id)
      .maybeSingle();

    if (vendorProfile) {
      return {
        user_id: vendorProfile.user_id,
        full_name: vendorProfile.full_name || "Vendor",
      };
    }

    return null;
  };

  const createRequest = async (
    data: Omit<
      MaintenanceRequest,
      "id" | "user_id" | "status" | "assigned_to" | "created_at" | "updated_at"
    >
  ) => {
    if (!user) throw new Error("Must be logged in");

    const matchingVendor = await findMatchingVendor(data.issue_type);

    const { data: newRequest, error } = await supabase
      .from("maintenance_requests")
      .insert({
        ...data,
        user_id: user.id,
        vendor_user_id: matchingVendor?.user_id || null,
        assigned_to: matchingVendor?.full_name || null,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("request_updates").insert({
      request_id: newRequest.id,
      update_type: "created",
      message: matchingVendor
        ? `Request submitted and auto-assigned to ${matchingVendor.full_name}`
        : "Request submitted",
    });

    if (matchingVendor) {
      try {
        await supabase.functions.invoke("notify-vendor-assignment", {
          body: {
            vendorUserId: matchingVendor.user_id,
            vendorName: matchingVendor.full_name,
            requestId: newRequest.id,
            requestTitle: data.title,
            issueType: data.issue_type,
            building: data.building,
            apartment: data.apartment,
            priority: data.priority,
          },
        });
      } catch (notifyError) {
        console.error("Error sending vendor notification:", notifyError);
      }
    }

    await fetchRequests();
    return newRequest;
  };

  return { requests, loading, createRequest, refetch: fetchRequests };
};

export const useRequestDetails = (requestId: string | undefined) => {
  const { user } = useAuth();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [updates, setUpdates] = useState<RequestUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    if (!user || !requestId) {
      setLoading(false);
      return;
    }

    try {
      const { data: requestData, error: requestError } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (requestError) throw requestError;
      setRequest(requestData);

      const { data: commentsData, error: commentsError } = await supabase
        .from("request_comments")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);

      const { data: updatesData, error: updatesError } = await supabase
        .from("request_updates")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (updatesError) throw updatesError;
      setUpdates(updatesData || []);
    } catch (error) {
      console.error("Error fetching request details:", error);
      toast.error("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [user, requestId]);

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`comments-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_comments",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as RequestComment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`updates-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_updates",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setUpdates((prev) => [...prev, payload.new as RequestUpdate]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const addComment = async (message: string, images: string[]) => {
    if (!user || !requestId) throw new Error("Must be logged in");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roleData?.some((r) => r.role === "admin") || false;
    const isVendor = roleData?.some((r) => r.role === "vendor") || false;

    const commenterRole = isAdmin ? "admin" : isVendor ? "vendor" : "tenant";
    const isStaff = isAdmin || isVendor;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const authorName = profileData?.full_name || user.email || "Unknown User";

    const { error } = await supabase.from("request_comments").insert({
      request_id: requestId,
      user_id: user.id,
      author: authorName,
      message: message || null,
      images,
      is_staff: isStaff,
      commenter_role: commenterRole,
    });

    if (error) throw error;
  };

  return { request, comments, updates, loading, addComment, refetch: fetchDetails };
};