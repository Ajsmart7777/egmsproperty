import { useNavigate } from "react-router-dom";
import { HelpCircle, MessageSquare, FileText, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileHeader from "@/components/ui/MobileHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const HelpSupport = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const faqs = [
    { q: "How do I submit a maintenance request?", a: "Go to the Dashboard and tap 'New Request'. Fill in the details about your issue, add photos if needed, and submit." },
    { q: "How long does it take to get a response?", a: "Most requests are reviewed within 24 hours. Emergency requests are prioritized and handled as soon as possible." },
    { q: "Can I cancel a maintenance request?", a: "You can cancel a request as long as it hasn't been assigned to a vendor yet. Go to My Requests and select the request to cancel." },
    { q: "How do I update my contact information?", a: "Go to Settings > Profile to update your name, phone number, and notification preferences." },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      {isMobile && (
        <MobileHeader title="Help & Support" onBack={() => navigate("/settings")} />
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {!isMobile && (
            <h1 className="text-2xl font-bold text-foreground mb-6">Help & Support</h1>
          )}

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>Find answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Get in Touch
              </CardTitle>
              <CardDescription>Need more help? Reach out to us</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => navigate("/contact")}
              >
                <FileText className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">Contact Management</p>
                  <p className="text-xs text-muted-foreground">View contact details and addresses</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HelpSupport;
