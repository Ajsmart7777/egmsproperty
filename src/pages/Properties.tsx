
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building2, Home, Plus, Pencil, Trash2 } from "lucide-react";

type Building = {
  id: string;
  name: string;
  address?: string;
  units: number;
};

type Unit = {
  id: string;
  unitNumber: string;
  buildingName: string;
  floor?: string;
};

export default function Properties() {
  const [activeTab, setActiveTab] = useState("buildings");

  const buildings: Building[] = [
    {
      id: "1",
      name: "Building A",
      address: "123 Main Street",
      units: 1,
    },
  ];

  const units: Unit[] = [
    {
      id: "1",
      unitNumber: "101",
      buildingName: "Building A",
      floor: "1st Floor",
    },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Properties</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage buildings and units
        </p>
      </div>

      <Tabs
        defaultValue="buildings"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-full overflow-x-hidden"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buildings" className="flex items-center gap-2 text-sm min-w-0">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Buildings</span>
            <span className="sm:hidden">Bldgs</span>
          </TabsTrigger>

          <TabsTrigger value="units" className="flex items-center gap-2 text-sm min-w-0">
            <Home className="h-4 w-4 shrink-0" />
            Units
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buildings" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Building</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Building2 className="h-5 w-5 shrink-0" />
                Buildings ({buildings.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              {buildings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No buildings yet. Add your first building to get started.
                </p>
              ) : (
                <>
                  <div className="md:hidden space-y-3">
                    {buildings.map((building) => (
                      <div
                        key={building.id}
                        className="w-full max-w-full rounded-xl bg-muted/30 p-4 space-y-3 overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground break-words">
                              {building.name}
                            </p>
                            <p className="text-sm text-muted-foreground break-words">
                              {building.address || "No address"}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {building.units} units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block space-y-4">
                    {buildings.map((building) => (
                      <div
                        key={building.id}
                        className="flex items-center justify-between rounded-xl bg-muted/20 p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{building.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {building.address || "No address"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {building.units} units
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Unit</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          <Card className="w-full max-w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Home className="h-5 w-5 shrink-0" />
                Units ({units.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              {units.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No units yet. Add your first unit to get started.
                </p>
              ) : (
                <>
                  <div className="md:hidden space-y-3">
                    {units.map((unit) => (
                      <div
                        key={unit.id}
                        className="w-full max-w-full rounded-xl bg-muted/30 p-4 space-y-2 overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground break-words">
                              Unit {unit.unitNumber}
                            </p>
                            <p className="text-sm text-muted-foreground break-words">
                              {unit.buildingName}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {unit.floor && (
                          <p className="text-sm text-muted-foreground">
                            Floor: {unit.floor}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block space-y-4">
                    {units.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between rounded-xl bg-muted/20 p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">Unit {unit.unitNumber}</p>
                          <p className="text-sm text-muted-foreground">{unit.buildingName}</p>
                          {unit.floor && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Floor: {unit.floor}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
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