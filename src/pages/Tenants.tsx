import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Users,
  Mail,
  Phone,
  Calendar,
  ShieldX,
  ShieldCheck,
  Building,
  Home,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Unit {
  id: string;
  unit_number: string;
  floor: string | null;
  building_id: string;
  building?: {
    id: string;
    name: string;
    address: string | null;
  };
}

interface Tenant {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  unit_id: string | null;
  unit?: Unit | null;
  created_at: string;
  isAdmin?: boolean;
}

interface BuildingOption {
  id: string;
  name: string;
  address: string | null;
}

export default function Tenants() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchTenants = async () => {
    if (!user) return;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!roleData);

    if (roleData) {
      // Fetch all profiles with unit info
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch all admin roles
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      // Fetch all units with buildings
      const { data: unitsData } = await supabase
        .from("units")
        .select("*, buildings(id, name, address)")
        .order("unit_number");

      // Fetch all buildings
      const { data: buildingsData } = await supabase
        .from("buildings")
        .select("id, name, address")
        .order("name");

      const adminUserIds = new Set(adminRoles?.map((r) => r.user_id) || []);
      const unitsMap = new Map(
        unitsData?.map((u) => [
          u.id,
          {
            ...u,
            building: u.buildings,
          },
        ]) || []
      );

      if (!error && profilesData) {
        setTenants(
          profilesData.map((p) => ({
            ...p,
            unit: p.unit_id ? unitsMap.get(p.unit_id) : null,
            isAdmin: adminUserIds.has(p.user_id),
          }))
        );
      }

      if (unitsData) {
        setUnits(
          unitsData.map((u) => ({
            ...u,
            building: u.buildings,
          }))
        );
      }

      if (buildingsData) {
        setBuildings(buildingsData);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, [user]);

  const toggleAdminRole = async (tenant: Tenant) => {
    if (tenant.user_id === user?.id) {
      toast.error("You cannot remove your own admin role");
      return;
    }

    setSaving(true);
    try {
      if (tenant.isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", tenant.user_id)
          .eq("role", "admin");

        if (error) throw error;
        toast.success(`Removed admin role from ${tenant.full_name || tenant.email}`);
      } else {
        // Add admin role
        const { error } = await supabase.from("user_roles").insert({
          user_id: tenant.user_id,
          role: "admin",
        });

        if (error) throw error;
        toast.success(`Granted admin role to ${tenant.full_name || tenant.email}`);
      }

      await fetchTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const openPropertyDialog = (tenant: Tenant) => {
    setEditingTenant(tenant);
    if (tenant.unit) {
      setSelectedBuildingId(tenant.unit.building_id);
      setSelectedUnitId(tenant.unit_id || "");
    } else {
      setSelectedBuildingId("");
      setSelectedUnitId("");
    }
  };

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedUnitId(""); // Reset unit when building changes
  };

  const saveProperty = async () => {
    if (!editingTenant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          unit_id: selectedUnitId || null,
        })
        .eq("id", editingTenant.id);

      if (error) throw error;

      toast.success("Property assignment updated");
      setEditingTenant(null);
      await fetchTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  const clearAssignment = async () => {
    if (!editingTenant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ unit_id: null })
        .eq("id", editingTenant.id);

      if (error) throw error;

      toast.success("Property assignment cleared");
      setEditingTenant(null);
      await fetchTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to clear assignment");
    } finally {
      setSaving(false);
    }
  };

  const filteredUnits = units.filter((u) => u.building_id === selectedBuildingId);

  const filteredTenants = tenants.filter((tenant) => {
    const query = searchQuery.toLowerCase();
    return (
      tenant.full_name?.toLowerCase().includes(query) ||
      tenant.email?.toLowerCase().includes(query) ||
      tenant.phone?.toLowerCase().includes(query) ||
      tenant.unit?.building?.name.toLowerCase().includes(query) ||
      tenant.unit?.unit_number.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <ShieldX className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You don't have permission to view this page.
        </p>
        <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Tenant Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage all registered tenants
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-xl self-start">
          <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <span className="text-sm font-semibold text-primary">{tenants.length} Tenants</span>
        </div>
      </div>

      {/* Search */}
      <Card className="border-border/50 shadow-card">
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tenants */}
      <Card className="border-border/50 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {searchQuery ? "No tenants match your search" : "No tenants registered yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="rounded-xl bg-muted/30 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {tenant.full_name || "—"}
                          </p>
                          {tenant.isAdmin && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{tenant.email || "—"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {tenant.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {tenant.phone}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {tenant.unit ? (
                        <>
                          <Building className="h-3 w-3" />
                          <span>{tenant.unit.building?.name} - Unit {tenant.unit.unit_number}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/60">Not assigned to property</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Joined {format(new Date(tenant.created_at), "MMM d, yyyy")}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => openPropertyDialog(tenant)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Property
                      </Button>
                      <Button
                        variant={tenant.isAdmin ? "destructive" : "default"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => toggleAdminRole(tenant)}
                        disabled={saving || tenant.user_id === user?.id}
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {tenant.isAdmin ? "Remove" : "Admin"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          {tenant.full_name || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {tenant.email || "—"}
                            </div>
                            {tenant.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {tenant.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.unit ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                {tenant.unit.building?.name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Home className="h-3 w-3" />
                                Unit {tenant.unit.unit_number}
                                {tenant.unit.floor && ` (Floor ${tenant.unit.floor})`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tenant.isAdmin ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Tenant</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tenant.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPropertyDialog(tenant)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Property
                            </Button>
                            <Button
                              variant={tenant.isAdmin ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleAdminRole(tenant)}
                              disabled={saving || tenant.user_id === user?.id}
                            >
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              {tenant.isAdmin ? "Remove Admin" : "Make Admin"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Property Assignment Dialog */}
      <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Property</DialogTitle>
            <DialogDescription>
              Assign a unit to {editingTenant?.full_name || editingTenant?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Building</Label>
              <Select value={selectedBuildingId} onValueChange={handleBuildingChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                      {building.address && ` - ${building.address}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
                disabled={!selectedBuildingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedBuildingId ? "Select a unit" : "Select a building first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      Unit {unit.unit_number}
                      {unit.floor && ` (Floor ${unit.floor})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBuildingId && filteredUnits.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No units found for this building. Add units in the Properties page.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingTenant?.unit_id && (
              <Button
                variant="outline"
                onClick={clearAssignment}
                disabled={saving}
                className="sm:mr-auto"
              >
                Clear Assignment
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditingTenant(null)}>
              Cancel
            </Button>
            <Button onClick={saveProperty} disabled={saving || !selectedUnitId}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
