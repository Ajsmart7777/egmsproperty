import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Globe, MapPin } from "lucide-react";

const typeIcons: Record<string, typeof Phone> = {
  phone: Phone,
  email: Mail,
  website: Globe,
  whatsapp: Phone,
};

export function Footer() {
  const { data: contacts = [] } = useQuery({
    queryKey: ["public-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_contacts").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["public-addresses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_addresses").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  if (contacts.length === 0 && addresses.length === 0) return null;

  return (
    <footer className="border-t border-border bg-muted/30 px-4 py-6 md:px-6 hidden md:block">
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {contacts.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Contact</h3>
            <div className="space-y-2">
              {contacts.map((c) => {
                const Icon = typeIcons[c.type] || Phone;
                return (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{c.label}: {c.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {addresses.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Addresses</h3>
            <div className="space-y-2">
              {addresses.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{a.label}: {a.address_line1}{a.city ? `, ${a.city}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
