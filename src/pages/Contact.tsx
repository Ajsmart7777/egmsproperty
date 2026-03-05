import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Globe, MapPin } from "lucide-react";

const typeIcons: Record<string, typeof Phone> = {
  phone: Phone,
  email: Mail,
  website: Globe,
  whatsapp: Phone,
};

export default function Contact() {
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

  const getContactHref = (type: string, value: string) => {
    switch (type) {
      case "phone": return `tel:${value}`;
      case "whatsapp": return `https://wa.me/${value.replace(/[^0-9+]/g, "")}`;
      case "email": return `mailto:${value}`;
      case "website": return value.startsWith("http") ? value : `https://${value}`;
      default: return "#";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Contact Us</h1>
        <p className="text-sm md:text-base text-muted-foreground">Get in touch with our team</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Info */}
        {contacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map((contact) => {
                const Icon = typeIcons[contact.type] || Phone;
                return (
                  <a
                    key={contact.id}
                    href={getContactHref(contact.type, contact.value)}
                    target={contact.type === "website" ? "_blank" : undefined}
                    rel={contact.type === "website" ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{contact.label}</p>
                      <p className="text-sm text-muted-foreground">{contact.value}</p>
                    </div>
                  </a>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Addresses */}
        {addresses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Our Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{address.label}</p>
                      <p className="text-sm text-muted-foreground">{address.address_line1}</p>
                      {address.address_line2 && (
                        <p className="text-sm text-muted-foreground">{address.address_line2}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {[address.city, address.state, address.zip_code].filter(Boolean).join(", ")}
                      </p>
                      {address.country && (
                        <p className="text-sm text-muted-foreground">{address.country}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {contacts.length === 0 && addresses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Contact information will be available soon.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
