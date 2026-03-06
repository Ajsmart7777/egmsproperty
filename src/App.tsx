import RoleBasedHome from "./pages/RoleBasedHome";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MaintenanceRequest from "./pages/MaintenanceRequest";
import MyRequests from "./pages/MyRequests";
import RequestDetail from "./pages/RequestDetail";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AuditLogs from "./pages/AuditLogs";
import VendorDashboard from "./pages/VendorDashboard";
import VendorProfile from "./pages/VendorProfile";
import Vendors from "./pages/Vendors";
import Tenants from "./pages/Tenants";
import Properties from "./pages/Properties";
import Contact from "./pages/Contact";
import PrivacySecurity from "./pages/PrivacySecurity";
import HelpSupport from "./pages/HelpSupport";
import EmergencyMaintenance from "./pages/EmergencyMaintenance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedHome />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenant-dashboard"
              element={
                <ProtectedRoute allow={["tenant"]}>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/maintenance-request"
              element={
                <ProtectedRoute allow={["tenant"]}>
                  <AppLayout>
                    <MaintenanceRequest />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-requests"
              element={
                <ProtectedRoute allow={["tenant"]}>
                  <AppLayout>
                    <MyRequests />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/request/:id"
              element={
                <ProtectedRoute allow={["tenant", "admin", "vendor"]}>
                  <AppLayout>
                    <RequestDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute allow={["tenant", "admin", "vendor"]}>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allow={["tenant", "admin", "vendor"]}>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/privacy-security"
              element={
                <ProtectedRoute allow={["tenant", "admin", "vendor"]}>
                  <AppLayout>
                    <PrivacySecurity />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/help-support"
              element={
                <ProtectedRoute allow={["tenant", "admin", "vendor"]}>
                  <AppLayout>
                    <HelpSupport />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/emergency-maintenance"
              element={
                <ProtectedRoute allow={["tenant"]}>
                  <AppLayout>
                    <EmergencyMaintenance />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <AppLayout>
                    <AdminSettings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <AppLayout>
                    <AuditLogs />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor"
              element={
                <ProtectedRoute allow={["vendor"]}>
                  <AppLayout>
                    <VendorDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/profile"
              element={
                <ProtectedRoute allow={["vendor"]}>
                  <AppLayout>
                    <VendorProfile />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendors"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <AppLayout>
                    <Vendors />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenants"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <AppLayout>
                    <Tenants />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/properties"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <AppLayout>
                    <Properties />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/contact"
              element={
                <ProtectedRoute allow={["tenant", "admin", "vendor"]}>
                  <AppLayout>
                    <Contact />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;