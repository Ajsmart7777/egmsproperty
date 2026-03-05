import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SPECIALTIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "appliance", label: "Appliance Repair" },
  { value: "painting", label: "Painting" },
  { value: "pest_control", label: "Pest Control" },
  { value: "bricklaying", label: "Bricklaying" },
  { value: "ac_washing", label: "AC/Washing Technician" },
  { value: "other", label: "General/Other" },
] as const;

export type Specialty = typeof SPECIALTIES[number]["value"];

export interface Vendor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialties: Specialty[];
}

export const useVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      // Get all users with vendor role
      const { data: vendorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "vendor");

      if (rolesError) throw rolesError;

      if (!vendorRoles || vendorRoles.length === 0) {
        setVendors([]);
        setLoading(false);
        return;
      }

      const vendorUserIds = vendorRoles.map((r) => r.user_id);

      // Get profiles for these vendors
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email")
        .in("user_id", vendorUserIds);

      if (profilesError) throw profilesError;

      // Get specialties for all vendors
      const { data: specialties, error: specialtiesError } = await supabase
        .from("vendor_specialties")
        .select("user_id, specialty")
        .in("user_id", vendorUserIds);

      if (specialtiesError) throw specialtiesError;

      // Group specialties by user_id
      const specialtiesByUser: Record<string, Specialty[]> = {};
      (specialties || []).forEach((s) => {
        if (!specialtiesByUser[s.user_id]) {
          specialtiesByUser[s.user_id] = [];
        }
        specialtiesByUser[s.user_id].push(s.specialty as Specialty);
      });

      setVendors(
        (profiles || []).map((p) => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name || "Unnamed Vendor",
          email: p.email || "",
          specialties: specialtiesByUser[p.user_id] || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSpecialties = async (userId: string, newSpecialties: Specialty[]) => {
    try {
      // Delete existing specialties
      await supabase
        .from("vendor_specialties")
        .delete()
        .eq("user_id", userId);

      // Insert new specialties
      if (newSpecialties.length > 0) {
        const { error } = await supabase
          .from("vendor_specialties")
          .insert(
            newSpecialties.map((specialty) => ({
              user_id: userId,
              specialty,
            }))
          );

        if (error) throw error;
      }

      await fetchVendors();
      return { success: true };
    } catch (error) {
      console.error("Error updating specialties:", error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return { vendors, loading, refetch: fetchVendors, updateSpecialties };
};
