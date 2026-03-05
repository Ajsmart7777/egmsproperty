import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Plus, Pencil, Trash2, GripVertical, Save, X, Settings, Phone } from "lucide-react";
import { AdminContactsManager } from "@/components/admin/AdminContactsManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IssueType {
  id: string;
  name: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

interface PriorityLevel {
  id: string;
  name: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

const iconOptions = [
  { value: "wrench", label: "Wrench (Plumbing)" },
  { value: "droplet", label: "Droplet (Water)" },
  { value: "zap", label: "Zap (Electrical)" },
  { value: "snowflake", label: "Snowflake (HVAC)" },
  { value: "settings", label: "Settings (Appliance)" },
  { value: "paintbrush", label: "Paintbrush (Painting)" },
  { value: "bug", label: "Bug (Pest Control)" },
  { value: "brick-wall", label: "Brick Wall (Bricklaying)" },
  { value: "fan", label: "Fan (AC/Washing)" },
  { value: "sparkles", label: "Sparkles (Cleaning)" },
  { value: "hard-hat", label: "Hard Hat (Structural)" },
  { value: "panel-top", label: "Panel (Aluminium)" },
  { value: "building", label: "Building (General)" },
  { value: "shield", label: "Shield (Security)" },
  { value: "thermometer", label: "Thermometer (Temperature)" },
  { value: "circle-ellipsis", label: "More (Others)" },
];

const colorPresets = [
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6b7280", label: "Gray" },
];

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Issue Types State
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueDeleteOpen, setIssueDeleteOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueType | null>(null);
  const [issueForm, setIssueForm] = useState({ name: "", icon: "wrench" });
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);

  // Priority Levels State
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [priorityDeleteOpen, setPriorityDeleteOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<PriorityLevel | null>(null);
  const [priorityForm, setPriorityForm] = useState({ name: "", color: "#6b7280" });
  const [deletingPriorityId, setDeletingPriorityId] = useState<string | null>(null);

  // Fetch Issue Types
  const { data: issueTypes = [], isLoading: loadingIssues } = useQuery({
    queryKey: ["admin-issue-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issue_types")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as IssueType[];
    },
  });

  // Fetch Priority Levels
  const { data: priorityLevels = [], isLoading: loadingPriorities } = useQuery({
    queryKey: ["admin-priority-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("priority_levels")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as PriorityLevel[];
    },
  });

  // Issue Type Mutations
  const createIssueMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      const maxOrder = Math.max(...issueTypes.map((t) => t.display_order), 0);
      const { data: newIssue, error } = await supabase.from("issue_types").insert({
        name: data.name,
        icon: data.icon,
        display_order: maxOrder + 1,
      }).select().single();
      if (error) throw error;
      return newIssue;
    },
    onSuccess: async (newIssue) => {
      queryClient.invalidateQueries({ queryKey: ["admin-issue-types"] });
      await logAction({
        action: "issue_type_created",
        entity_type: "issue_type",
        entity_id: newIssue.id,
        details: { name: newIssue.name, icon: newIssue.icon },
      });
      toast.success("Issue type created");
      setIssueDialogOpen(false);
      setIssueForm({ name: "", icon: "wrench" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; icon: string }) => {
      const { error } = await supabase
        .from("issue_types")
        .update({ name: data.name, icon: data.icon })
        .eq("id", data.id);
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-issue-types"] });
      await logAction({
        action: "issue_type_updated",
        entity_type: "issue_type",
        entity_id: data.id,
        details: { name: data.name, icon: data.icon },
      });
      toast.success("Issue type updated");
      setIssueDialogOpen(false);
      setEditingIssue(null);
      setIssueForm({ name: "", icon: "wrench" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleIssueActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("issue_types")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-issue-types"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      const issue = issueTypes.find(i => i.id === id);
      const { error } = await supabase.from("issue_types").delete().eq("id", id);
      if (error) throw error;
      return { id, name: issue?.name };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-issue-types"] });
      await logAction({
        action: "issue_type_deleted",
        entity_type: "issue_type",
        entity_id: data.id,
        details: { name: data.name },
      });
      toast.success("Issue type deleted");
      setIssueDeleteOpen(false);
      setDeletingIssueId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Priority Level Mutations
  const createPriorityMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const maxOrder = Math.max(...priorityLevels.map((p) => p.display_order), 0);
      const { data: newPriority, error } = await supabase.from("priority_levels").insert({
        name: data.name,
        color: data.color,
        display_order: maxOrder + 1,
      }).select().single();
      if (error) throw error;
      return newPriority;
    },
    onSuccess: async (newPriority) => {
      queryClient.invalidateQueries({ queryKey: ["admin-priority-levels"] });
      await logAction({
        action: "priority_level_created",
        entity_type: "priority_level",
        entity_id: newPriority.id,
        details: { name: newPriority.name, color: newPriority.color },
      });
      toast.success("Priority level created");
      setPriorityDialogOpen(false);
      setPriorityForm({ name: "", color: "#6b7280" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; color: string }) => {
      const { error } = await supabase
        .from("priority_levels")
        .update({ name: data.name, color: data.color })
        .eq("id", data.id);
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-priority-levels"] });
      await logAction({
        action: "priority_level_updated",
        entity_type: "priority_level",
        entity_id: data.id,
        details: { name: data.name, color: data.color },
      });
      toast.success("Priority level updated");
      setPriorityDialogOpen(false);
      setEditingPriority(null);
      setPriorityForm({ name: "", color: "#6b7280" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const togglePriorityActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("priority_levels")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-priority-levels"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deletePriorityMutation = useMutation({
    mutationFn: async (id: string) => {
      const priority = priorityLevels.find(p => p.id === id);
      const { error } = await supabase.from("priority_levels").delete().eq("id", id);
      if (error) throw error;
      return { id, name: priority?.name };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-priority-levels"] });
      await logAction({
        action: "priority_level_deleted",
        entity_type: "priority_level",
        entity_id: data.id,
        details: { name: data.name },
      });
      toast.success("Priority level deleted");
      setPriorityDeleteOpen(false);
      setDeletingPriorityId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openEditIssue = (issue: IssueType) => {
    setEditingIssue(issue);
    setIssueForm({ name: issue.name, icon: issue.icon });
    setIssueDialogOpen(true);
  };

  const openEditPriority = (priority: PriorityLevel) => {
    setEditingPriority(priority);
    setPriorityForm({ name: priority.name, color: priority.color });
    setPriorityDialogOpen(true);
  };

  const handleIssueSubmit = () => {
    if (!issueForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editingIssue) {
      updateIssueMutation.mutate({ id: editingIssue.id, ...issueForm });
    } else {
      createIssueMutation.mutate(issueForm);
    }
  };

  const handlePrioritySubmit = () => {
    if (!priorityForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editingPriority) {
      updatePriorityMutation.mutate({ id: editingPriority.id, ...priorityForm });
    } else {
      createPriorityMutation.mutate(priorityForm);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-muted-foreground text-sm">Manage issue types, priority levels, and company info</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Issue Types Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Issue Types</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingIssue(null);
                setIssueForm({ name: "", icon: "wrench" });
                setIssueDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingIssues ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : issueTypes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No issue types configured</p>
            ) : (
              issueTypes.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className={issue.is_active ? "" : "text-muted-foreground line-through"}>
                      {issue.name}
                    </span>
                    <span className="text-xs text-muted-foreground">({issue.icon})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={issue.is_active}
                      onCheckedChange={(checked) =>
                        toggleIssueActiveMutation.mutate({ id: issue.id, is_active: checked })
                      }
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditIssue(issue)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingIssueId(issue.id);
                        setIssueDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Priority Levels Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Priority Levels</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingPriority(null);
                setPriorityForm({ name: "", color: "#6b7280" });
                setPriorityDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingPriorities ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : priorityLevels.length === 0 ? (
              <p className="text-muted-foreground text-sm">No priority levels configured</p>
            ) : (
              priorityLevels.map((priority) => (
                <div
                  key={priority.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: priority.color }}
                    />
                    <span className={priority.is_active ? "" : "text-muted-foreground line-through"}>
                      {priority.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={priority.is_active}
                      onCheckedChange={(checked) =>
                        togglePriorityActiveMutation.mutate({ id: priority.id, is_active: checked })
                      }
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditPriority(priority)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingPriorityId(priority.id);
                        setPriorityDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contacts & Addresses Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Company Contacts & Addresses
        </h2>
        <AdminContactsManager />
      </div>

      {/* Issue Type Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIssue ? "Edit Issue Type" : "Add Issue Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="issue-name">Name</Label>
              <Input
                id="issue-name"
                value={issueForm.name}
                onChange={(e) => setIssueForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Plumbing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-icon">Icon</Label>
              <Select
                value={issueForm.icon}
                onValueChange={(value) => setIssueForm((prev) => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIssueSubmit} disabled={createIssueMutation.isPending || updateIssueMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Level Dialog */}
      <Dialog open={priorityDialogOpen} onOpenChange={setPriorityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPriority ? "Edit Priority Level" : "Add Priority Level"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="priority-name">Name</Label>
              <Input
                id="priority-name"
                value={priorityForm.name}
                onChange={(e) => setPriorityForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., High"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setPriorityForm((prev) => ({ ...prev, color: color.value }))}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      priorityForm.color === color.value ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="custom-color" className="text-sm text-muted-foreground">
                  Custom:
                </Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={priorityForm.color}
                  onChange={(e) => setPriorityForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-8 p-0 border-0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriorityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrioritySubmit} disabled={createPriorityMutation.isPending || updatePriorityMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Issue Type Confirmation */}
      <AlertDialog open={issueDeleteOpen} onOpenChange={setIssueDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this issue type. Existing requests with this type will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingIssueId && deleteIssueMutation.mutate(deletingIssueId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Priority Level Confirmation */}
      <AlertDialog open={priorityDeleteOpen} onOpenChange={setPriorityDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Priority Level?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this priority level. Existing requests with this priority will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPriorityId && deletePriorityMutation.mutate(deletingPriorityId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSettings;
