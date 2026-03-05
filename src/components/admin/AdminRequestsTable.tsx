import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Droplet,
  Zap,
  Wind,
  Wrench,
  Paintbrush,
  Bug,
  Home,
  MoreHorizontal,
  Eye,
  CheckCircle,
  UserPlus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useVendors } from "@/hooks/useVendors";
import type { AdminMaintenanceRequest } from "@/hooks/useAdminRequests";

interface AdminRequestsTableProps {
  requests: AdminMaintenanceRequest[];
  onUpdateStatus: (requestId: string, status: string) => void;
  onBulkUpdateStatus: (requestIds: string[], status: string) => void;
  onAssignStaff: (requestId: string, vendorUserId: string, vendorName: string) => void;
}

const issueTypeIcons: Record<string, typeof Droplet> = {
  plumbing: Droplet,
  electrical: Zap,
  hvac: Wind,
  appliance: Wrench,
  painting: Paintbrush,
  pest_control: Bug,
  other: Home,
};

// Mapping from issue type names (from DB) to vendor specialty values
const issueTypeToSpecialtyMap: Record<string, string> = {
  "plumbing": "plumbing",
  "electrical": "electrical",
  "hvac": "hvac",
  "appliance repair": "appliance",
  "painting": "painting",
  "pest control": "pest_control",
  "bricklaying": "bricklaying",
  "ac/washing technician": "ac_washing",
  "cleaning": "other",
  "structural": "other",
  "alluminium technician": "other",
  "others": "other",
};

const getMatchingSpecialty = (issueType: string): string => {
  const normalized = issueType.toLowerCase();
  return issueTypeToSpecialtyMap[normalized] || "other";
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-[hsl(var(--status-pending))]/10 text-[hsl(var(--status-pending))]",
  high: "bg-destructive/10 text-destructive",
};

const statusColors: Record<string, string> = {
  pending: "bg-[hsl(var(--status-pending))]/10 text-[hsl(var(--status-pending))]",
  in_progress: "bg-secondary/10 text-secondary",
  completed: "bg-primary/10 text-primary",
};

export const AdminRequestsTable = ({
  requests,
  onUpdateStatus,
  onBulkUpdateStatus,
  onAssignStaff,
}: AdminRequestsTableProps) => {
  const navigate = useNavigate();
  const { vendors, loading: vendorsLoading } = useVendors();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestIssueType, setSelectedRequestIssueType] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getIssueIcon = (issueType: string) => {
    const Icon = issueTypeIcons[issueType] || Home;
    return <Icon className="h-4 w-4" />;
  };

  const handleAssignClick = (requestId: string, issueType: string) => {
    setSelectedRequestId(requestId);
    setSelectedRequestIssueType(issueType);
    setSelectedVendorId("");
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = () => {
    if (selectedRequestId && selectedVendorId) {
      const vendor = vendors.find(v => v.user_id === selectedVendorId);
      if (vendor) {
        onAssignStaff(selectedRequestId, selectedVendorId, vendor.full_name);
        setAssignDialogOpen(false);
      }
    }
  };

  // Calculate workload per vendor (active requests = pending or in_progress)
  const vendorWorkload = vendors.reduce((acc, vendor) => {
    const activeRequests = requests.filter(
      r => r.assigned_to === vendor.full_name && 
           (r.status === "pending" || r.status === "in_progress")
    ).length;
    acc[vendor.user_id] = activeRequests;
    return acc;
  }, {} as Record<string, number>);

  const getAvailabilityStatus = (workload: number) => {
    if (workload === 0) return { label: "Available", color: "bg-primary/10 text-primary" };
    if (workload <= 2) return { label: "Light", color: "bg-primary/10 text-primary" };
    if (workload <= 5) return { label: "Moderate", color: "bg-[hsl(var(--status-pending))]/10 text-[hsl(var(--status-pending))]" };
    return { label: "Busy", color: "bg-destructive/10 text-destructive" };
  };

  // Sort vendors: matching specialties first, then by workload (less busy first)
  const matchingSpecialty = getMatchingSpecialty(selectedRequestIssueType);
  const sortedVendors = [...vendors].sort((a, b) => {
    const aMatches = a.specialties.includes(matchingSpecialty as any);
    const bMatches = b.specialties.includes(matchingSpecialty as any);
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    // Within same match status, sort by workload (ascending)
    const aWorkload = vendorWorkload[a.user_id] || 0;
    const bWorkload = vendorWorkload[b.user_id] || 0;
    if (aWorkload !== bWorkload) return aWorkload - bWorkload;
    return a.full_name.localeCompare(b.full_name);
  });

  const handleReopenClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setReopenDialogOpen(true);
  };

  const handleReopenConfirm = () => {
    if (selectedRequestId) {
      onUpdateStatus(selectedRequestId, "pending");
      setReopenDialogOpen(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkAction = (status: string) => {
    onBulkUpdateStatus(Array.from(selectedIds), status);
    clearSelection();
  };

  return (
    <>
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("in_progress")}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Mark In Progress
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("completed")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Completed
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-card border-0 overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No requests found
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 space-y-3 active:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(request.id)}
                          onCheckedChange={() => toggleSelect(request.id)}
                        />
                      </div>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/request/${request.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-muted shrink-0">
                            {getIssueIcon(request.issue_type)}
                          </span>
                          <p className="font-medium text-foreground truncate">{request.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.tenant_name}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/request/${request.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {request.status !== "completed" && (
                            <DropdownMenuItem
                              onClick={() => onUpdateStatus(request.id, "completed")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Completed
                            </DropdownMenuItem>
                          )}
                          {request.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => onUpdateStatus(request.id, "in_progress")}
                            >
                              <Wrench className="h-4 w-4 mr-2" />
                              Mark In Progress
                            </DropdownMenuItem>
                          )}
                          {request.status === "completed" && (
                            <DropdownMenuItem
                              onClick={() => handleReopenClick(request.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reopen Request
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleAssignClick(request.id, request.issue_type)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Vendor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{request.building}</span>
                    <span>•</span>
                    <span>Apt {request.apartment}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`capitalize text-xs ${priorityColors[request.priority]}`}
                      >
                        {request.priority}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`capitalize text-xs ${statusColors[request.status]}`}
                      >
                        {request.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), "MMM d")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === requests.length && requests.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Tenant</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Issue</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Submitted</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/request/${request.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(request.id)}
                          onCheckedChange={() => toggleSelect(request.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {request.tenant_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.tenant_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.building}</p>
                          <p className="text-xs text-muted-foreground">
                            Apt {request.apartment}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-muted">
                            {getIssueIcon(request.issue_type)}
                          </span>
                          <span className="text-sm">{request.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`capitalize ${priorityColors[request.priority]}`}
                        >
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`capitalize ${statusColors[request.status]}`}
                        >
                          {request.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/request/${request.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {request.status !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(request.id, "completed")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                            {request.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(request.id, "in_progress")}
                              >
                                <Wrench className="h-4 w-4 mr-2" />
                                Mark In Progress
                              </DropdownMenuItem>
                            )}
                            {request.status === "completed" && (
                              <DropdownMenuItem
                                onClick={() => handleReopenClick(request.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reopen Request
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleAssignClick(request.id, request.issue_type)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Assign Vendor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Vendor</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {selectedRequestIssueType && (
              <div className="text-sm text-muted-foreground">
                Issue type: <span className="font-medium text-foreground capitalize">{selectedRequestIssueType.replace("_", " ")}</span>
              </div>
            )}
            <div>
              <Label htmlFor="vendor">Select Vendor</Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={vendorsLoading ? "Loading vendors..." : "Select a vendor"} />
                </SelectTrigger>
                <SelectContent>
                  {sortedVendors.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No vendors available
                    </SelectItem>
                  ) : (
                    sortedVendors.map((vendor) => {
                      const isMatch = vendor.specialties.includes(matchingSpecialty as any);
                      const workload = vendorWorkload[vendor.user_id] || 0;
                      const availability = getAvailabilityStatus(workload);
                      return (
                        <SelectItem key={vendor.user_id} value={vendor.user_id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2">
                              <span>{vendor.full_name}</span>
                              {isMatch && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Match
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${availability.color}`}>
                                {availability.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {workload} active
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Workload Legend */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span>Available (0-2)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-pending))]"></span>
                <span>Moderate (3-5)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive"></span>
                <span>Busy (6+)</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignSubmit} disabled={!selectedVendorId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to reopen this completed request? The status will be set back to pending.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReopenConfirm}>
              Reopen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
