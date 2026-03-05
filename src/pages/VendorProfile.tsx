import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Save, Loader2, Wrench, Camera, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SPECIALTIES, Specialty } from "@/hooks/useVendors";
import MobileHeader from "@/components/ui/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

const VendorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: null,
  });
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Check if user is a vendor
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "vendor")
        .maybeSingle();

      setIsVendor(!!roleData);

      if (!roleData) {
        setLoading(false);
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") throw profileError;

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || user?.email || "",
          phone: profileData.phone || "",
          avatar_url: profileData.avatar_url || null,
        });
      } else {
        setProfile((prev) => ({
          ...prev,
          email: user?.email || "",
        }));
      }

      // Fetch specialties
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from("vendor_specialties")
        .select("specialty")
        .eq("user_id", user?.id);

      if (specialtiesError) throw specialtiesError;

      setSpecialties((specialtiesData || []).map((s) => s.specialty as Specialty));
    } catch (error) {
      console.error("Error fetching vendor profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            full_name: profile.full_name.trim(),
            email: profile.email.trim(),
            phone: profile.phone.trim(),
            avatar_url: profile.avatar_url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      // Update specialties - delete existing and insert new
      const { error: deleteError } = await supabase
        .from("vendor_specialties")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      if (specialties.length > 0) {
        const { error: insertError } = await supabase
          .from("vendor_specialties")
          .insert(
            specialties.map((specialty) => ({
              user_id: user.id,
              specialty,
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (specialty: Specialty) => {
    setSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      await supabase.storage.from("avatars").remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile state
      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));

      // Update profile in database
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      toast.success("Profile photo updated");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const updateProfile = (key: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              This page is only for vendor accounts.
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      {isMobile && (
        <MobileHeader title="Vendor Profile" onBack={() => navigate("/vendor")} />
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {!isMobile && (
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Vendor Profile</h1>
                <p className="text-muted-foreground">
                  Manage your contact info and specialties
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}

          {/* Avatar & Name Card */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover shadow-card"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-3xl shadow-card">
                      {profile.full_name?.charAt(0).toUpperCase() ||
                        user?.email?.charAt(0).toUpperCase() ||
                        "V"}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    {profile.full_name || "Vendor"}
                  </CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">Vendor</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="h-7 text-xs"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Upload className="h-3 w-3 mr-1" />
                      )}
                      Change Photo
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Contact Details */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Keep your contact details up to date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => updateProfile("full_name", e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-10 h-11 rounded-xl border-border bg-muted/30 focus:bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    placeholder="Enter your email"
                    className="pl-10 h-11 rounded-xl border-border bg-muted/30 focus:bg-background"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => updateProfile("phone", e.target.value)}
                    placeholder="Enter your phone number"
                    className="pl-10 h-11 rounded-xl border-border bg-muted/30 focus:bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specialties */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Specialties
              </CardTitle>
              <CardDescription>
                Select the types of maintenance you handle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {SPECIALTIES.map((specialty) => (
                  <div
                    key={specialty.value}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={specialty.value}
                      checked={specialties.includes(specialty.value)}
                      onCheckedChange={() => toggleSpecialty(specialty.value)}
                    />
                    <label
                      htmlFor={specialty.value}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {specialty.label}
                    </label>
                  </div>
                ))}
              </div>
              
              {specialties.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Selected specialties:</p>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((s) => (
                      <Badge key={s} variant="secondary">
                        {SPECIALTIES.find((sp) => sp.value === s)?.label || s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Save Button */}
          {isMobile && (
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-xl gap-2 shadow-card"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VendorProfile;
