import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Home } from "lucide-react";

type Building = {
  id: string;
  name: string;
  address: string | null;
};

export default function Properties() {
  const [activeTab, setActiveTab] = useState("buildings");

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name, address")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Building[];
    },
  });

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
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buildings" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Buildings
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Units
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buildings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buildings ({buildings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : buildings.length === 0 ? (
                <p className="text-muted-foreground text-sm">No buildings found.</p>
              ) : (
                <div className="space-y-3">
                  {buildings.map((building) => (
                    <div key={building.id} className="rounded-xl bg-muted/30 p-4">
                      <p className="font-medium text-foreground">{building.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {building.address || "No address"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Units</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Units section will be added next.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}