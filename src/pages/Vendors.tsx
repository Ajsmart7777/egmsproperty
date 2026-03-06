import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVendors, SPECIALTIES, Specialty, Vendor } from "@/hooks/useVendors";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Wrench,
  Mail,
  User,
  AlertCircle,
  Settings2,
  Download,
  Upload,
  FileText,
} from "lucide-react";

const Vendors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const { vendors, loading, refetch, updateSpecialties } = useVendors();

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [specialtiesDialogOpen, setSpecialtiesDialogOpen] = useState(false);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingSpecialties, setEditingSpecialties] = useState<Specialty[]>([]);

  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorPassword, setNewVendorPassword] = useState("");
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorSpecialties, setNewVendorSpecialties] = useState<Specialty[]>([]);

  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [savingSpecialties, setSavingSpecialties] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
      setAdminLoading(false);
    };

    checkAdmin();
  }, [user]);

  const resetCreateForm = () => {
    setNewVendorEmail("");
    setNewVendorPassword("");
    setNewVendorName("");
    setNewVendorSpecialties([]);
  };

  const parseFunctionError = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      return data?.error || data?.message || "Request failed";
    }

    const text = await response.text().catch(() => "");
    return text || "Request failed";
  };

  const handleCreateVendor = async () => {
    if (!newVendorEmail || !newVendorPassword || !newVendorName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newVendorPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const adminToken = session?.access_token;

      if (!adminToken) {
        throw new Error("Admin session not found");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error("Missing Supabase environment variables");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-vendor-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            email: newVendorEmail.trim().toLowerCase(),
            password: newVendorPassword,
            fullName: newVendorName.trim(),
            specialties: newVendorSpecialties,
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = await parseFunctionError(response);
        throw new Error(errorMessage || "Failed to create vendor account");
      }

      const result = await response.json();

      await logAction({
        action: "vendor_created",
        entity_type: "vendor",
        entity_id: result.userId,
        details: {
          vendor_name: newVendorName,
          vendor_email: newVendorEmail,
          specialties: newVendorSpecialties,
        },
      });

      toast.success(`Vendor account created for ${newVendorName}`);
      setCreateDialogOpen(false);
      resetCreateForm();
      refetch();
    } catch (error: any) {
      console.error("Error creating vendor:", error);
      toast.error(String(error?.message || "Failed to create vendor account"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!selectedVendor) return;

    setRevoking(true);

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedVendor.user_id)
        .eq("role", "vendor");

      if (error) throw error;

      await logAction({
        action: "role_revoked",
        entity_type: "user_role",
        entity_id: selectedVendor.user_id,
        details: {
          vendor_name: selectedVendor.full_name,
          vendor_email: selectedVendor.email,
          role: "vendor",
        },
      });

      toast.success(`Vendor access revoked for ${selectedVendor.full_name}`);
      setRevokeDialogOpen(false);
      setSelectedVendor(null);
      refetch();
    } catch (error) {
      console.error("Error revoking vendor access:", error);
      toast.error("Failed to revoke vendor access");
    } finally {
      setRevoking(false);
    }
  };

  const handleOpenSpecialties = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setEditingSpecialties([...vendor.specialties]);
    setSpecialtiesDialogOpen(true);
  };

  const handleSaveSpecialties = async () => {
    if (!selectedVendor) return;

    setSavingSpecialties(true);
    const result = await updateSpecialties(selectedVendor.user_id, editingSpecialties);
    setSavingSpecialties(false);

    if (result.success) {
      await logAction({
        action: "vendor_specialties_updated",
        entity_type: "vendor",
        entity_id: selectedVendor.user_id,
        details: {
          vendor_name: selectedVendor.full_name,
          old_specialties: selectedVendor.specialties,
          new_specialties: editingSpecialties,
        },
      });

      toast.success("Specialties updated");
      setSpecialtiesDialogOpen(false);
    } else {
      toast.error("Failed to update specialties");
    }
  };

  const toggleSpecialty = (
    specialty: Specialty,
    list: Specialty[],
    setList: (s: Specialty[]) => void
  ) => {
    if (list.includes(specialty)) {
      setList(list.filter((s) => s !== specialty));
    } else {
      setList([...list, specialty]);
    }
  };

  const getSpecialtyLabel = (value: string) => {
    return SPECIALTIES.find((s) => s.value === value)?.label || value;
  };

  const handleDownloadTemplate = () => {
    const headers = ["Name", "Email", "Password", "Specialties"];
    const sampleData = [
      '"John Smith","john@example.com","SecurePass123","Plumbing; Electrical"',
      '"Jane Doe","jane@example.com","SecurePass456","HVAC; Appliance Repair"',
    ];
    const csvContent = [headers.join(","), ...sampleData].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vendor_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded");
  };

  const handleExportVendors = () => {
    const headers = ["Name", "Email", "Specialties"];
    const csvContent = [
      headers.join(","),
      ...vendors.map((vendor) =>
        [
          `"${vendor.full_name}"`,
          `"${vendor.email}"`,
          `"${vendor.specialties.map(getSpecialtyLabel).join("; ")}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vendors_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Vendors exported successfully");
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const handleImportVendors = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress({ current: 0, total: 0 });

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          toast.error("CSV file must have a header row and at least one data row");
          setImporting(false);
          return;
        }

        const dataRows = lines.slice(1);
        setImportProgress({ current: 0, total: dataRows.length });

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const adminToken = session?.access_token;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!adminToken) {
          throw new Error("Admin session not found");
        }

        if (!supabaseUrl || !anonKey) {
          throw new Error("Missing Supabase environment variables");
        }

        let successCount = 0;
        let errorCount = 0;
        let processedCount = 0;
        const errors: string[] = [];

        for (const row of dataRows) {
          const columns = parseCSVLine(row);

          if (columns.length < 3) {
            processedCount++;
            setImportProgress({ current: processedCount, total: dataRows.length });
            continue;
          }

          const [name, email, password, specialtiesStr] = columns;

          if (!name || !email || !password) {
            errors.push(`Skipped row: missing required fields (name, email, or password)`);
            errorCount++;
            processedCount++;
            setImportProgress({ current: processedCount, total: dataRows.length });
            continue;
          }

          const specialtyLabels = specialtiesStr
            ? specialtiesStr.split(";").map((s) => s.trim())
            : [];

          const vendorSpecialties: Specialty[] = specialtyLabels
            .map(
              (label) =>
                SPECIALTIES.find(
                  (s) => s.label.toLowerCase() === label.toLowerCase()
                )?.value
            )
            .filter((s): s is Specialty => !!s);

          try {
            const response = await fetch(
              `${supabaseUrl}/functions/v1/create-vendor-role`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${adminToken}`,
                  apikey: anonKey,
                },
                body: JSON.stringify({
                  email: email.trim().toLowerCase(),
                  password: password.trim(),
                  fullName: name.trim(),
                  specialties: vendorSpecialties,
                }),
              }
            );

            if (!response.ok) {
              const errorMessage = await parseFunctionError(response);
              throw new Error(errorMessage || "Failed to create vendor");
            }

            successCount++;
          } catch (error: any) {
            errors.push(`Failed to process ${email}: ${error.message}`);
            errorCount++;
          } finally {
            processedCount++;
            setImportProgress({ current: processedCount, total: dataRows.length });
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} vendor(s)`);
          refetch();
        }

        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} vendor(s)`);
          console.error("Import errors:", errors);
        }
      } catch (error: any) {
        console.error("Error importing vendors:", error);
        toast.error(error.message || "Failed to import vendors");
      } finally {
        setImporting(false);
        setImportProgress({ current: 0, total: 0 });

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  };

  if (adminLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have admin access to manage vendors.
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendor Management</h1>
          <p className="text-muted-foreground">Create and manage vendor accounts</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileText className="h-4 w-4 mr-2" />
            Template
          </Button>

          <Button
            variant="outline"
            onClick={handleExportVendors}
            disabled={vendors.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing
              ? `Importing ${importProgress.current}/${importProgress.total}`
              : "Import"}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportVendors}
          />

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{vendors.length}</div>
              <div className="text-sm text-muted-foreground">Total Vendors</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vendors</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Vendors Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first vendor account to get started.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {vendors.map((vendor) => (
                  <Card key={vendor.user_id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{vendor.full_name}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{vendor.email}</span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {vendor.specialties.length > 0 ? (
                              vendor.specialties.map((s) => (
                                <Badge key={s} variant="outline" className="text-xs">
                                  {getSpecialtyLabel(s)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No specialties
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenSpecialties(vendor)}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setRevokeDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Specialties</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.user_id}>
                        <TableCell className="font-medium">{vendor.full_name}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {vendor.specialties.length > 0 ? (
                              vendor.specialties.map((s) => (
                                <Badge key={s} variant="outline" className="text-xs">
                                  {getSpecialtyLabel(s)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenSpecialties(vendor)}
                            >
                              <Settings2 className="h-4 w-4 mr-2" />
                              Specialties
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setRevokeDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Vendor Account</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Full Name</Label>
              <Input
                id="vendorName"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="Enter vendor's full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorEmail">Email</Label>
              <Input
                id="vendorEmail"
                type="email"
                value={newVendorEmail}
                onChange={(e) => setNewVendorEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorPassword">Password</Label>
              <Input
                id="vendorPassword"
                type="password"
                value={newVendorPassword}
                onChange={(e) => setNewVendorPassword(e.target.value)}
                placeholder="Create a password"
              />
            </div>

            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="grid grid-cols-2 gap-2">
                {SPECIALTIES.map((specialty) => (
                  <div key={specialty.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`new-${specialty.value}`}
                      checked={newVendorSpecialties.includes(specialty.value)}
                      onCheckedChange={() =>
                        toggleSpecialty(
                          specialty.value,
                          newVendorSpecialties,
                          setNewVendorSpecialties
                        )
                      }
                    />
                    <label
                      htmlFor={`new-${specialty.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {specialty.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVendor} disabled={creating}>
              {creating ? "Creating..." : "Create Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={specialtiesDialogOpen} onOpenChange={setSpecialtiesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Specialties - {selectedVendor?.full_name}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-2 gap-3">
              {SPECIALTIES.map((specialty) => (
                <div key={specialty.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${specialty.value}`}
                    checked={editingSpecialties.includes(specialty.value)}
                    onCheckedChange={() =>
                      toggleSpecialty(
                        specialty.value,
                        editingSpecialties,
                        setEditingSpecialties
                      )
                    }
                  />
                  <label
                    htmlFor={`edit-${specialty.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {specialty.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSpecialtiesDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSpecialties} disabled={savingSpecialties}>
              {savingSpecialties ? "Saving..." : "Save Specialties"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Vendor Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke vendor access for{" "}
              {selectedVendor?.full_name}? They will no longer be able to view or
              update assigned maintenance requests.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revoking}
            >
              {revoking ? "Revoking..." : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vendors;