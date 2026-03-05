import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { mapErrorToUserMessage } from "@/lib/errorHandler";
import { Mail, Lock, User } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const getRedirectPath = async (userId: string): Promise<string> => {
    // Check if user is a vendor
    const { data: vendorRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "vendor")
      .maybeSingle();

    if (vendorRole) return "/vendor";

    // Check if user is an admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (adminRole) return "/admin";

    return "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { user } = await signIn(formData.email, formData.password);
        toast.success("Welcome back!");
        const redirectPath = await getRedirectPath(user.id);
        navigate(redirectPath);
      } else {
        if (!formData.fullName.trim()) {
          toast.error("Please enter your full name");
          setLoading(false);
          return;
        }
        await signUp(formData.email, formData.password, formData.fullName);
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (error: unknown) {
      toast.error(mapErrorToUserMessage(error, "Authentication failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="bg-primary text-primary-foreground px-6 py-8 lg:py-0 lg:w-[45%] xl:w-[40%] lg:min-h-screen lg:flex lg:flex-col lg:justify-center lg:items-center lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary opacity-90" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-secondary/30 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <div className="bg-white rounded-xl p-3 shadow-elevated">
              <Logo size="lg" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 hidden lg:block">
            Property Management Made Simple
          </h1>
          <p className="text-sm sm:text-base opacity-90 lg:text-lg lg:opacity-80">
            {isLogin ? "Sign in to manage your maintenance requests" : "Create an account to get started"}
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 p-6 sm:p-8 lg:p-12 animate-fade-in flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-card p-6 sm:p-8 shadow-card border border-border/50">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isLogin ? "Enter your credentials to continue" : "Fill in your details to get started"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="h-12 pl-10 rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="h-12 pl-10 rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-12 pl-10 rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 sm:h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-card hover:bg-secondary transition-all duration-200 hover:shadow-elevated"
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <span className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-semibold text-primary hover:text-secondary transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
