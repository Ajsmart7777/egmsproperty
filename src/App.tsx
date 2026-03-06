import RoleProtectedRoute from "@/components/RoleProtectedRoute";
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
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant"]}>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/maintenance-request"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant"]}>
                    <AppLayout>
                      <MaintenanceRequest />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-requests"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant"]}>
                    <AppLayout>
                      <MyRequests />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/request/:id"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant", "admin", "vendor"]}>
                    <AppLayout>
                      <RequestDetail />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant", "admin", "vendor"]}>
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant", "admin", "vendor"]}>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/privacy-security"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant", "admin", "vendor"]}>
                    <AppLayout>
                      <PrivacySecurity />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/help-support"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant", "admin", "vendor"]}>
                    <AppLayout>
                      <HelpSupport />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/emergency-maintenance"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant"]}>
                    <AppLayout>
                      <EmergencyMaintenance />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["admin"]}>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["admin"]}>
                    <AppLayout>
                      <AdminSettings />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["admin"]}>
                    <AppLayout>
                      <AuditLogs />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["vendor"]}>
                    <AppLayout>
                      <VendorDashboard />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/profile"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["vendor"]}>
                    <AppLayout>
                      <VendorProfile />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendors"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["admin"]}>
                    <AppLayout>
                      <Vendors />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenants"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["admin"]}>
                    <AppLayout>
                      <Tenants />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/properties"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["admin"]}>
                    <AppLayout>
                      <Properties />
                    </AppLayout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/contact"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allow={["tenant", "admin", "vendor"]}>
                    <AppLayout>
                      <Contact />
                    </AppLayout>
                  </RoleProtectedRoute>
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