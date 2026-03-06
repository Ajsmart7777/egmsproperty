import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/ui/MobileHeader";
import SelectableChip from "@/components/ui/SelectableChip";
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
import {
  Droplets,
  Zap,
  Sparkles,
  Building2,
  MoreHorizontal,
  Wrench,
  Thermometer,
  Shield,
  PaintBucket,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useMaintenanceRequests } from "@/hooks/useMaintenanceRequests";
import { useImageUpload } from "@/hooks/useImageUpload";
import { mapErrorToUserMessage } from "@/lib/errorHandler";

// Icon mapping
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

interface Building {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  building_id: string;
  unit_number: string;
}

const EmergencyMaintenance = () => {
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
    phone: "",
  });
  const [attachments, setAttachments] = useState<string[]>([]);

  // Fetch buildings
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

  // Fetch units based on selected building
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

  // Fetch issue types
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

  useEffect(() => {
    setFormData((prev) => ({ ...prev, apartment: "" }));
  }, [formData.building]);

  const handleIssueTypeSelect = (type: string) => {
    setFormData((prev) => ({ ...prev, issueType: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.building ||
      !formData.apartment ||
      !formData.issueType ||
      !formData.phone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrls: string[] = [];

      if (attachments.length > 0) {
        toast.loading("Uploading images...");
        imageUrls = await uploadImages(attachments);
        toast.dismiss();
      }

      const selectedBuilding = buildings.find((b) => b.id === formData.building);

      await createRequest({
        title: `EMERGENCY: ${formData.title}`,
        description: `${formData.description}\n\nEmergency Contact Number: ${formData.phone}`,
        building: selectedBuilding?.name || formData.building,
        apartment: formData.apartment,
        issue_type: formData.issueType,
        priority: "high",
        images: imageUrls,
      });

      toast.success("Emergency maintenance request submitted successfully!");
      navigate("/my-requests");
    } catch (error: unknown) {
      toast.error(mapErrorToUserMessage(error, "Failed to submit emergency request"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <MobileHeader title="Emergency Maintenance" onBack={() => navigate("/")} />

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 pb-8 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-red-700">
                  Emergency Request Only
                </h2>
                <p className="text-sm text-red-600 mt-1">
                  Use this form only for urgent issues such as flooding, electrical hazards,
                  severe plumbing leaks, security risks, or anything that needs immediate attention.
                </p>
              </div>
            </div>
          </div>

          {/* Issue Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Emergency Title
            </Label>
            <Input
              id="title"
              placeholder="Pipe burst in bathroom"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="h-12 rounded-xl border-border bg-card shadow-soft focus:border-red-500 focus:ring-red-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Describe the emergency
            </Label>
            <Textarea
              id="description"
              placeholder="Please explain the urgent issue clearly..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="min-h-[120px] rounded-xl border-border bg-card shadow-soft focus:border-red-500 focus:ring-red-500 resize-none"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Emergency Contact Number
            </Label>
            <Input
              id="phone"
              placeholder="Enter active phone number"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="h-12 rounded-xl border-border bg-card shadow-soft focus:border-red-500 focus:ring-red-500"
            />
          </div>

          {/* Building & Apartment */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Building / Property
              </Label>
              <Select
                value={formData.building}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, building: value }))
                }
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Apartment / Room
              </Label>
              <Select
                value={formData.apartment}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, apartment: value }))
                }
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

          {/* Issue Type */}
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

          {/* Priority Notice */}
          <div className="rounded-xl bg-red-100 p-4">
            <p className="text-sm font-medium text-red-700">
              Priority: High
            </p>
            <p className="text-sm text-red-600 mt-1">
              All emergency requests are automatically submitted with high priority.
            </p>
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
              className="w-full sm:w-auto sm:min-w-[220px] h-12 sm:h-14 rounded-xl bg-red-600 text-white font-semibold text-sm sm:text-base shadow-card hover:bg-red-700 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Emergency Request"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmergencyMaintenance;