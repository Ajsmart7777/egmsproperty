import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Save, Phone, Mail, Globe, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  label: string;
  type: string;
  value: string;
  display_order: number;
  is_active: boolean;
}

interface Address {
  id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  display_order: number;
  is_active: boolean;
}

const contactTypes = [
  { value: "phone", label: "Phone", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "website", label: "Website", icon: Globe },
  { value: "whatsapp", label: "WhatsApp", icon: Phone },
];

export function AdminContactsManager() {
  const queryClient = useQueryClient();

  // Contact state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactDeleteOpen, setContactDeleteOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState({ label: "", type: "phone", value: "" });
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Address state
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressDeleteOpen, setAddressDeleteOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "", address_line1: "", address_line2: "", city: "", state: "", zip_code: "", country: "UAE",
  });
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  // Fetch
  const { data: contacts = [] } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_contacts").select("*").order("display_order");
      if (error) throw error;
      return data as Contact[];
    },
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["admin-addresses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_addresses").select("*").order("display_order");
      if (error) throw error;
      return data as Address[];
    },
  });

  // Contact mutations
  const createContact = useMutation({
    mutationFn: async (form: typeof contactForm) => {
      const maxOrder = Math.max(...contacts.map(c => c.display_order), 0);
      const { error } = await supabase.from("company_contacts").insert({
        label: form.label, type: form.type, value: form.value, display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
      toast.success("Contact added");
      setContactDialogOpen(false);
      setContactForm({ label: "", type: "phone", value: "" });
    },
    onError: () => toast.error("Failed to add contact"),
  });

  const updateContact = useMutation({
    mutationFn: async (form: typeof contactForm) => {
      if (!editingContact) return;
      const { error } = await supabase.from("company_contacts")
        .update({ label: form.label, type: form.type, value: form.value })
        .eq("id", editingContact.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
      toast.success("Contact updated");
      setContactDialogOpen(false);
      setEditingContact(null);
      setContactForm({ label: "", type: "phone", value: "" });
    },
    onError: () => toast.error("Failed to update contact"),
  });

  const toggleContact = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("company_contacts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-contacts"] }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
      toast.success("Contact deleted");
      setContactDeleteOpen(false);
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  // Address mutations
  const createAddress = useMutation({
    mutationFn: async (form: typeof addressForm) => {
      const maxOrder = Math.max(...addresses.map(a => a.display_order), 0);
      const { error } = await supabase.from("company_addresses").insert({
        label: form.label, address_line1: form.address_line1,
        address_line2: form.address_line2 || null, city: form.city || null,
        state: form.state || null, zip_code: form.zip_code || null,
        country: form.country || null, display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addresses"] });
      toast.success("Address added");
      setAddressDialogOpen(false);
      setAddressForm({ label: "", address_line1: "", address_line2: "", city: "", state: "", zip_code: "", country: "UAE" });
    },
    onError: () => toast.error("Failed to add address"),
  });

  const updateAddress = useMutation({
    mutationFn: async (form: typeof addressForm) => {
      if (!editingAddress) return;
      const { error } = await supabase.from("company_addresses")
        .update({
          label: form.label, address_line1: form.address_line1,
          address_line2: form.address_line2 || null, city: form.city || null,
          state: form.state || null, zip_code: form.zip_code || null,
          country: form.country || null,
        })
        .eq("id", editingAddress.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addresses"] });
      toast.success("Address updated");
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm({ label: "", address_line1: "", address_line2: "", city: "", state: "", zip_code: "", country: "UAE" });
    },
    onError: () => toast.error("Failed to update address"),
  });

  const toggleAddress = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("company_addresses").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-addresses"] }),
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-addresses"] });
      toast.success("Address deleted");
      setAddressDeleteOpen(false);
    },
    onError: () => toast.error("Failed to delete address"),
  });

  const getTypeIcon = (type: string) => {
    const found = contactTypes.find(t => t.value === type);
    return found ? <found.icon className="h-4 w-4 text-muted-foreground" /> : null;
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contacts Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Contact Info</CardTitle>
            <Button size="sm" onClick={() => {
              setEditingContact(null);
              setContactForm({ label: "", type: "phone", value: "" });
              setContactDialogOpen(true);
            }}>
             {/* removed plus icon */}
          </CardHeader>
          <CardContent className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No contacts added yet</p>
            ) : contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {getTypeIcon(contact.type)}
                  <div>
                    <span className={contact.is_active ? "" : "text-muted-foreground line-through"}>{contact.label}</span>
                    <p className="text-xs text-muted-foreground">{contact.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={contact.is_active} onCheckedChange={(checked) => toggleContact.mutate({ id: contact.id, is_active: checked })} />
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingContact(contact);
                    setContactForm({ label: contact.label, type: contact.type, value: contact.value });
                    setContactDialogOpen(true);
                  }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setDeletingContactId(contact.id);
                    setContactDeleteOpen(true);
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Addresses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Addresses</CardTitle>
            <Button size="sm" onClick={() => {
              setEditingAddress(null);
              setAddressForm({ label: "", address_line1: "", address_line2: "", city: "", state: "", zip_code: "", country: "UAE" });
              setAddressDialogOpen(true);
            }}>
              {/* removed plus icon */}
          </CardHeader>
          <CardContent className="space-y-2">
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">No addresses added yet</p>
            ) : addresses.map((address) => (
              <div key={address.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className={address.is_active ? "" : "text-muted-foreground line-through"}>{address.label}</span>
                    <p className="text-xs text-muted-foreground">{address.address_line1}{address.city ? `, ${address.city}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={address.is_active} onCheckedChange={(checked) => toggleAddress.mutate({ id: address.id, is_active: checked })} />
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingAddress(address);
                    setAddressForm({
                      label: address.label, address_line1: address.address_line1,
                      address_line2: address.address_line2 || "", city: address.city || "",
                      state: address.state || "", zip_code: address.zip_code || "", country: address.country || "UAE",
                    });
                    setAddressDialogOpen(true);
                  }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setDeletingAddressId(address.id);
                    setAddressDeleteOpen(true);
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={contactForm.label} onChange={(e) => setContactForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g., Main Office" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={contactForm.type} onValueChange={(v) => setContactForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contactTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input value={contactForm.value} onChange={(e) => setContactForm(p => ({ ...p, value: e.target.value }))} placeholder="e.g., +971 50 123 4567" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => editingContact ? updateContact.mutate(contactForm) : createContact.mutate(contactForm)} disabled={!contactForm.label.trim() || !contactForm.value.trim()}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add Address"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={addressForm.label} onChange={(e) => setAddressForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g., Head Office" />
            </div>
            <div className="space-y-2">
              <Label>Address Line 1</Label>
              <Input value={addressForm.address_line1} onChange={(e) => setAddressForm(p => ({ ...p, address_line1: e.target.value }))} placeholder="e.g., Building 5, Street 10" />
            </div>
            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input value={addressForm.address_line2} onChange={(e) => setAddressForm(p => ({ ...p, address_line2: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={addressForm.city} onChange={(e) => setAddressForm(p => ({ ...p, city: e.target.value }))} placeholder="e.g., Dubai" />
              </div>
              <div className="space-y-2">
                <Label>State/Emirate</Label>
                <Input value={addressForm.state} onChange={(e) => setAddressForm(p => ({ ...p, state: e.target.value }))} placeholder="e.g., Dubai" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ZIP/Postal Code</Label>
                <Input value={addressForm.zip_code} onChange={(e) => setAddressForm(p => ({ ...p, zip_code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={addressForm.country} onChange={(e) => setAddressForm(p => ({ ...p, country: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => editingAddress ? updateAddress.mutate(addressForm) : createAddress.mutate(addressForm)} disabled={!addressForm.label.trim() || !addressForm.address_line1.trim()}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <AlertDialog open={contactDeleteOpen} onOpenChange={setContactDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this contact information.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingContactId && deleteContact.mutate(deletingContactId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={addressDeleteOpen} onOpenChange={setAddressDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this address.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingAddressId && deleteAddress.mutate(deletingAddressId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
