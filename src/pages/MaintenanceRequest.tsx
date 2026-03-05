import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/ui/MobileHeader";
import SelectableChip from "@/components/ui/SelectableChip";
import PriorityRadio from "@/components/ui/PriorityRadio";
import ImageUpload from "@/components/ui/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Droplets, Zap, Sparkles, Building2, MoreHorizontal, Wrench, Thermometer, Shield, PaintBucket } from "lucide-react";
import { toast } from "sonner";
import { useMaintenanceRequests } from "@/hooks/useMaintenanceRequests";
import { useImageUpload } from "@/hooks/useImageUpload";
import { mapErrorToUserMessage } from "@/lib/errorHandler";

// Icon mapping for dynamic issue types
const iconMap: Record<string, React.ReactNode> = {
  droplet: <Droplets className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
  building: <Building2 className="h-4 w-4" />,
  wrench: <Wrench className="h-4 w-4" />,
  thermometer: <Thermometer className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  "paint-bucket": <PaintBucket className="h-4 w-4" />,
  "more-horizontal": <MoreHorizontal className="h-4 w-4" />,
};

interface IssueType {
  id: string;
  name: string;
  icon: string;
  display_order: number;
}

interface PriorityLevel {
  id: string;
  name: string;
  color: string;
  display_order: number;
}
interface Building {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  building_id: string;
  unit_number: string;
}

const MaintenanceRequest = () => {
  const navigate = useNavigate();
  const { createRequest } = useMaintenanceRequests();
  const { uploadImages } = useImageUpload();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    building: "",
    apartment: "",
    issueType: "",
    priority: "",
  });
  const [attachments, setAttachments] = useState<string[]>([]);

  // Fetch buildings from database
  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Building[];
    },
  });

  // Fetch units filtered by selected building
  const { data: units = [] } = useQuery({
    queryKey: ["units", formData.building],
    queryFn: async () => {
      if (!formData.building) return [];
      const { data, error } = await supabase
        .from("units")
        .select("id, building_id, unit_number")
        .eq("building_id", formData.building)
        .order("unit_number");
      if (error) throw error;
      return data as Unit[];
    },
    enabled: !!formData.building,
  });

  // Fetch dynamic issue types
  const { data: issueTypes = [] } = useQuery({
    queryKey: ["issue-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issue_types")
        .select("id, name, icon, display_order")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as IssueType[];
    },
  });

  // Fetch dynamic priority levels
  const { data: priorityLevels = [] } = useQuery({
    queryKey: ["priority-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("priority_levels")
        .select("id, name, color, display_order")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as PriorityLevel[];
    },
  });

  // Reset apartment when building changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, apartment: "" }));
  }, [formData.building]);

  const handleIssueTypeSelect = (type: string) => {
    setFormData((prev) => ({ ...prev, issueType: type }));
  };

  const handlePriorityChange = (priority: string) => {
    setFormData((prev) => ({ ...prev, priority }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.building || !formData.apartment || !formData.issueType || !formData.priority) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // Upload images to storage
      let imageUrls: string[] = [];
      if (attachments.length > 0) {
        toast.loading("Uploading images...");
        imageUrls = await uploadImages(attachments);
        toast.dismiss();
      }

      // Get building name from the selected building
      const selectedBuilding = buildings.find(b => b.id === formData.building);
      
      await createRequest({
        title: formData.title,
        description: formData.description,
        building: selectedBuilding?.name || formData.building,
        apartment: formData.apartment,
        issue_type: formData.issueType,
        priority: formData.priority,
        images: imageUrls,
      });

      toast.success("Maintenance request submitted successfully!");
      navigate("/my-requests");
    } catch (error: unknown) {
      toast.error(mapErrorToUserMessage(error, "Failed to submit request"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <MobileHeader title="Maintenance Request" onBack={() => navigate("/")} />
      
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 pb-8 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Issue Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Issue Title
            </Label>
            <Input
              id="title"
              placeholder="Water leakage in bathroom"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="h-12 rounded-xl border-border bg-card shadow-soft focus:border-primary focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Describe the problem
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide details about the issue..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-[120px] rounded-xl border-border bg-card shadow-soft focus:border-primary focus:ring-primary resize-none"
            />
          </div>

          {/* Building & Apartment Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Building Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Building / Property</Label>
              <Select
                value={formData.building}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, building: value }))}
              >
                <SelectTrigger className="h-12 rounded-xl border-border bg-card shadow-soft">
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card shadow-elevated">
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id} className="rounded-lg">
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Apartment Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Apartment / Room</Label>
              <Select
                value={formData.apartment}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, apartment: value }))}
                disabled={!formData.building}
              >
                <SelectTrigger className="h-12 rounded-xl border-border bg-card shadow-soft">
                  <SelectValue placeholder={formData.building ? "Select unit" : "Select building first"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card shadow-elevated">
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.unit_number} className="rounded-lg">
                      {unit.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Issue Type Chips */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Issue Type</Label>
            <div className="flex flex-wrap gap-2">
              {issueTypes.map((type) => (
                <SelectableChip
                  key={type.id}
                  label={type.name}
                  icon={iconMap[type.icon] || <Wrench className="h-4 w-4" />}
                  selected={formData.issueType === type.name.toLowerCase()}
                  onClick={() => handleIssueTypeSelect(type.name.toLowerCase())}
                />
              ))}
            </div>
          </div>

          {/* Priority Radio */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Priority</Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {priorityLevels.map((priority) => (
                <PriorityRadio
                  key={priority.id}
                  value={priority.name.toLowerCase()}
                  label={priority.name}
                  selected={formData.priority === priority.name.toLowerCase()}
                  onChange={handlePriorityChange}
                  color={priority.name.toLowerCase() as "low" | "medium" | "high"}
                  customColor={priority.color}
                />
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Attachments</Label>
            <ImageUpload
              images={attachments}
              onImagesChange={setAttachments}
              maxImages={5}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto sm:min-w-[200px] h-12 sm:h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-card hover:bg-secondary transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceRequest;
