import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Home, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Building {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

interface Unit {
  id: string;
  building_id: string;
  unit_number: string;
  floor: string | null;
  created_at: string;
  buildings?: { name: string };
}

export default function Properties() {
  const queryClient = useQueryClient();
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Building form state
  const [buildingName, setBuildingName] = useState("");
  const [buildingAddress, setBuildingAddress] = useState("");

  // Unit form state
  const [unitNumber, setUnitNumber] = useState("");
  const [unitFloor, setUnitFloor] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");

  // Fetch buildings
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Building[];
    },
  });

  // Fetch units with building info
  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*, buildings(name)")
        .order("unit_number");
      if (error) throw error;
      return data as Unit[];
    },
  });

  // Building mutations
  const createBuilding = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("buildings").insert({
        name: buildingName,
        address: buildingAddress || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success("Building created successfully");
      resetBuildingForm();
      setBuildingDialogOpen(false);
    },
    onError: () => toast.error("Failed to create building"),
  });

  const updateBuilding = useMutation({
    mutationFn: async () => {
      if (!editingBuilding) return;
      const { error } = await supabase
        .from("buildings")
        .update({ name: buildingName, address: buildingAddress || null })
        .eq("id", editingBuilding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success("Building updated successfully");
      resetBuildingForm();
      setBuildingDialogOpen(false);
    },
    onError: () => toast.error("Failed to update building"),
  });

  const deleteBuilding = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("buildings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Building deleted successfully");
    },
    onError: () => toast.error("Failed to delete building. Make sure all units are removed first."),
  });

  // Unit mutations
  const createUnit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("units").insert({
        building_id: selectedBuildingId,
        unit_number: unitNumber,
        floor: unitFloor || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit created successfully");
      resetUnitForm();
      setUnitDialogOpen(false);
    },
    onError: () => toast.error("Failed to create unit"),
  });

  const updateUnit = useMutation({
    mutationFn: async () => {
      if (!editingUnit) return;
      const { error } = await supabase
        .from("units")
        .update({
          building_id: selectedBuildingId,
          unit_number: unitNumber,
          floor: unitFloor || null,
        })
        .eq("id", editingUnit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit updated successfully");
      resetUnitForm();
      setUnitDialogOpen(false);
    },
    onError: () => toast.error("Failed to update unit"),
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("units").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit deleted successfully");
    },
    onError: () => toast.error("Failed to delete unit"),
  });

  const resetBuildingForm = () => {
    setBuildingName("");
    setBuildingAddress("");
    setEditingBuilding(null);
  };

  const resetUnitForm = () => {
    setUnitNumber("");
    setUnitFloor("");
    setSelectedBuildingId("");
    setEditingUnit(null);
  };

  const openEditBuilding = (building: Building) => {
    setEditingBuilding(building);
    setBuildingName(building.name);
    setBuildingAddress(building.address || "");
    setBuildingDialogOpen(true);
  };

  const openEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitNumber(unit.unit_number);
    setUnitFloor(unit.floor || "");
    setSelectedBuildingId(unit.building_id);
    setUnitDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Properties</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage buildings and units</p>
      </div>

      <Tabs defaultValue="buildings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buildings" className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Buildings</span>
            <span className="sm:hidden">Bldgs</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4" />
            Units
          </TabsTrigger>
        </TabsList>

        {/* Buildings Tab */}
        <TabsContent value="buildings" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={buildingDialogOpen} onOpenChange={(open) => {
              setBuildingDialogOpen(open);
              if (!open) resetBuildingForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Building</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingBuilding ? "Edit Building" : "Add Building"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="buildingName">Building Name *</Label>
                    <Input
                      id="buildingName"
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                      placeholder="e.g., Building A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buildingAddress">Address</Label>
                    <Input
                      id="buildingAddress"
                      value={buildingAddress}
                      onChange={(e) => setBuildingAddress(e.target.value)}
                      placeholder="e.g., 123 Main St"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => editingBuilding ? updateBuilding.mutate() : createBuilding.mutate()}
                    disabled={!buildingName.trim()}
                  >
                    {editingBuilding ? "Update Building" : "Create Building"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Building2 className="h-5 w-5" />
                Buildings ({buildings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {buildingsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : buildings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No buildings yet. Add your first building to get started.
                </p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {buildings.map((building) => {
                      const unitCount = units.filter(u => u.building_id === building.id).length;
                      return (
                        <div key={building.id} className="rounded-xl bg-muted/30 p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{building.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{building.address || "No address"}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditBuilding(building)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => deleteBuilding.mutate(building.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{unitCount} units</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buildings.map((building) => {
                          const unitCount = units.filter(u => u.building_id === building.id).length;
                          return (
                            <TableRow key={building.id}>
                              <TableCell className="font-medium">{building.name}</TableCell>
                              <TableCell>{building.address || "-"}</TableCell>
                              <TableCell>{unitCount}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditBuilding(building)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteBuilding.mutate(building.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={unitDialogOpen} onOpenChange={(open) => {
              setUnitDialogOpen(open);
              if (!open) resetUnitForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9" disabled={buildings.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Unit</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingUnit ? "Edit Unit" : "Add Unit"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Building *</Label>
                    <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select building" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitNumber">Unit Number *</Label>
                    <Input
                      id="unitNumber"
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      placeholder="e.g., 101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitFloor">Floor</Label>
                    <Input
                      id="unitFloor"
                      value={unitFloor}
                      onChange={(e) => setUnitFloor(e.target.value)}
                      placeholder="e.g., 1st Floor"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => editingUnit ? updateUnit.mutate() : createUnit.mutate()}
                    disabled={!unitNumber.trim() || !selectedBuildingId}
                  >
                    {editingUnit ? "Update Unit" : "Create Unit"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Home className="h-5 w-5" />
                Units ({units.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : buildings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  Add a building first before creating units.
                </p>
              ) : units.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No units yet. Add your first unit to get started.
                </p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {units.map((unit) => (
                      <div key={unit.id} className="rounded-xl bg-muted/30 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">Unit {unit.unit_number}</p>
                            <p className="text-sm text-muted-foreground">{unit.buildings?.name || "-"}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditUnit(unit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteUnit.mutate(unit.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {unit.floor && (
                          <p className="text-sm text-muted-foreground">Floor: {unit.floor}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit Number</TableHead>
                          <TableHead>Building</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {units.map((unit) => (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.unit_number}</TableCell>
                            <TableCell>{unit.buildings?.name || "-"}</TableCell>
                            <TableCell>{unit.floor || "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditUnit(unit)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteUnit.mutate(unit.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}