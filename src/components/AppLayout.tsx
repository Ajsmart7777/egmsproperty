import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Footer } from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={true}>
      {isMobile ? (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
          <div className="w-full max-w-full overflow-x-hidden pb-20">
            {children}
          </div>
          <MobileNav />
        </div>
      ) : (
        <div className="min-h-screen flex w-full max-w-full overflow-x-hidden bg-background">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden min-w-0">
            <header className="h-14 flex items-center border-b border-border px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
              <SidebarTrigger className="hover:bg-muted rounded-lg transition-colors" />
              <div className="ml-4 text-sm font-medium text-muted-foreground">
                Property Management Portal
              </div>
            </header>
            <div className="flex-1 w-full max-w-full overflow-x-hidden bg-gradient-to-br from-background via-background to-brand-light/30">
              {children}
            </div>
            <Footer />
          </main>
        </div>
      )}
    </SidebarProvider>
  );
}