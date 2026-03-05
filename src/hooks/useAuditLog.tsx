import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | "role_granted"
  | "role_revoked"
  | "vendor_created"
  | "vendor_specialties_updated"
  | "request_status_changed"
  | "request_assigned"
  | "issue_type_created"
  | "issue_type_updated"
  | "issue_type_deleted"
  | "priority_level_created"
  | "priority_level_updated"
  | "priority_level_deleted"
  | "building_created"
  | "building_updated"
  | "building_deleted"
  | "unit_created"
  | "unit_updated"
  | "unit_deleted";

export type EntityType = 
  | "user_role"
  | "vendor"
  | "maintenance_request"
  | "issue_type"
  | "priority_level"
  | "building"
  | "unit";

interface AuditLogEntry {
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export const useAuditLog = () => {
  const logAction = async (entry: AuditLogEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("Cannot log audit action: user not authenticated");
        return { success: false };
      }

      const { error } = await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: entry.action,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          details: entry.details as Record<string, unknown>,
        } as never);

      if (error) {
        console.error("Failed to log audit action:", error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error("Audit logging error:", error);
      return { success: false, error };
    }
  };

  return { logAction };
};
