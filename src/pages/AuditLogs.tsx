import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { Shield, Search, Filter, Download, FileText } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
}

const actionLabels: Record<string, string> = {
  role_granted: "Role Granted",
  role_revoked: "Role Revoked",
  vendor_created: "Vendor Created",
  vendor_specialties_updated: "Vendor Specialties Updated",
  request_status_changed: "Request Status Changed",
  request_assigned: "Request Assigned",
  issue_type_created: "Issue Type Created",
  issue_type_updated: "Issue Type Updated",
  issue_type_deleted: "Issue Type Deleted",
  priority_level_created: "Priority Created",
  priority_level_updated: "Priority Updated",
  priority_level_deleted: "Priority Deleted",
  building_created: "Building Created",
  building_updated: "Building Updated",
  building_deleted: "Building Deleted",
  unit_created: "Unit Created",
  unit_updated: "Unit Updated",
  unit_deleted: "Unit Deleted",
};

const entityLabels: Record<string, string> = {
  user_role: "User Role",
  vendor: "Vendor",
  maintenance_request: "Request",
  issue_type: "Issue Type",
  priority_level: "Priority",
  building: "Building",
  unit: "Unit",
};

const getActionColor = (action: string) => {
  if (action.includes("deleted") || action.includes("revoked")) return "destructive";
  if (action.includes("created") || action.includes("granted")) return "default";
  return "secondary";
};

const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set((logsData || []).map((l) => l.user_id))];
      
      let profilesMap: Record<string, { full_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);
        
        profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.user_id] = { full_name: p.full_name || "", email: p.email || "" };
          return acc;
        }, {} as Record<string, { full_name: string; email: string }>);
      }

      return (logsData || []).map((log) => ({
        ...log,
        profiles: profilesMap[log.user_id] || null,
      })) as AuditLog[];
    },
  });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueEntities = [...new Set(logs.map((l) => l.entity_type))];

  const handleExport = () => {
    const headers = ["Date", "User", "Action", "Entity Type", "Entity ID", "Details"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) =>
        [
          format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
          `"${log.profiles?.full_name || log.profiles?.email || log.user_id}"`,
          `"${actionLabels[log.action] || log.action}"`,
          `"${entityLabels[log.entity_type] || log.entity_type}"`,
          log.entity_id || "",
          `"${log.details ? JSON.stringify(log.details).replace(/"/g, '""') : ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_logs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground text-sm">Track admin actions and changes</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={filteredLogs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionLabels[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {uniqueEntities.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entityLabels[entity] || entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-xs text-muted-foreground">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action.includes("created") || l.action.includes("granted")).length}
            </div>
            <div className="text-xs text-muted-foreground">Creates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action.includes("updated")).length}
            </div>
            <div className="text-xs text-muted-foreground">Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action.includes("deleted") || l.action.includes("revoked")).length}
            </div>
            <div className="text-xs text-muted-foreground">Deletes</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.profiles?.full_name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.profiles?.email || log.user_id.slice(0, 8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action) as "default" | "destructive" | "secondary"}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {entityLabels[log.entity_type] || log.entity_type}
                        </span>
                        {log.entity_id && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {log.entity_id.slice(0, 8)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.details && (
                          <div className="text-xs text-muted-foreground truncate">
                            {Object.entries(log.details)
                              .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                              .join(", ")}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
