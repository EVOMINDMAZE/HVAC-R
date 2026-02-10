import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { useToast } from "@/hooks/useToast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSubscription, useCustomerPortal } from "@/hooks/useStripe";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Building,
  MapPin,
  Phone,
  Calendar,
  Shield,
  Bell,
  Key,
  CreditCard,
  Download,
  Trash2,
  Camera,
} from "lucide-react";
import CompanySettings from "./CompanySettings";
import { PageContainer } from "@/components/PageContainer";

// User data comes from Supabase authentication and real backend data

export function Profile() {
  const { user: authUser, updateUser } = useSupabaseAuth();
  const { calculations } = useSupabaseCalculations();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { uploadAvatar, removeAvatar, uploading } = useFileUpload();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { openCustomerPortal, loading: portalLoading } = useCustomerPortal();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: {
      emailResults: true,
      weeklyUsage: true,
      productUpdates: false,
      securityAlerts: true,
    },
    defaultUnits: {
      temperature: "celsius",
      pressure: "kpa",
    },
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Initialize user state with real Supabase data
  const getInitialUser = () => {
    if (!authUser) {
      return {
        id: "",
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        role: "",
        phone: "",
        location: "",
        avatar: "",
        joinedDate: "",
        plan: "Free",
        calculationsUsed: 0,
        calculationsLimit: 10,
      };
    }

    return {
      id: authUser.id,
      firstName:
        authUser.user_metadata?.first_name ||
        authUser.email?.split("@")[0] ||
        "User",
      lastName: authUser.user_metadata?.last_name || "",
      email: authUser.email || "",
      company: authUser.user_metadata?.company || "",
      role: authUser.user_metadata?.role || "",
      phone: authUser.phone || "",
      location: authUser.user_metadata?.location || "",
      avatar: authUser.user_metadata?.avatar_url || "",
      joinedDate: authUser.created_at?.split("T")[0] || "2024-01-01",
      plan: "Free",
      calculationsUsed: 0,
      calculationsLimit: 10,
    };
  };

  const initialUser = getInitialUser();

  const [user, setUser] = useState(initialUser);

  // Update local state when auth user, subscription, or calculations change
  useEffect(() => {
    if (authUser) {
      const plan = subscription?.plan || "free";
      const planDisplayName =
        plan.charAt(0).toUpperCase() + plan.slice(1).replace("_", " ");
      const isUnlimited = plan !== "free";

      // Calculate real usage from Supabase calculations
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyCalculations = calculations.filter((calc) => {
        const calcDate = new Date(calc.created_at);
        return (
          calcDate.getMonth() === currentMonth &&
          calcDate.getFullYear() === currentYear
        );
      }).length;

      setUser({
        id: authUser.id,
        firstName:
          authUser.user_metadata?.first_name ||
          authUser.email?.split("@")[0] ||
          "User",
        lastName: authUser.user_metadata?.last_name || "",
        email: authUser.email || "",
        company: authUser.user_metadata?.company || "",
        role: authUser.user_metadata?.role || "",
        phone: authUser.phone || "",
        location: authUser.user_metadata?.location || "",
        avatar: authUser.user_metadata?.avatar_url || "",
        joinedDate: authUser.created_at?.split("T")[0] || "2024-01-01",
        plan: planDisplayName,
        calculationsUsed: monthlyCalculations,
        calculationsLimit: isUnlimited ? -1 : 10,
      });

      // Load preferences from user metadata
      if (authUser.user_metadata?.preferences) {
        try {
          const userPrefs = JSON.parse(authUser.user_metadata.preferences);
          setPreferences((prev) => ({ ...prev, ...userPrefs }));
        } catch (error) {
          console.warn("Failed to parse user preferences:", error);
        }
      }
    }
  }, [authUser, subscription, calculations]);

  const handleSave = async () => {
    if (!authUser) {
      addToast({
        type: "error",
        title: "Not Authenticated",
        description: "Please sign in to save changes",
      });
      return;
    }

    setLoading(true);
    try {
      // Update user metadata in Supabase
      const { error } = await updateUser({
        data: {
          first_name: user.firstName,
          last_name: user.lastName,
          company: user.company,
          role: user.role,
          location: user.location,
        },
      });

      if (error) throw error;

      addToast({
        type: "success",
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Save Failed",
        description: error.message || "Failed to save profile changes",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { url } = await uploadAvatar(file);
    if (url) {
      setUser((prev) => ({ ...prev, avatar: url }));
    }

    // Reset file input
    event.target.value = "";
  };

  const handleAvatarRemove = async () => {
    const { success } = await removeAvatar();
    if (success) {
      setUser((prev) => ({ ...prev, avatar: "" }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authUser) {
      addToast({
        type: "error",
        title: "Not Authenticated",
        description: "Please sign in to change your password",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      addToast({
        type: "error",
        title: "Password Mismatch",
        description: "New passwords do not match",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addToast({
        type: "error",
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await updateUser({
        data: {
          password: passwordForm.newPassword,
        },
      });

      if (error) throw error;

      addToast({
        type: "success",
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePreferencesSave = async () => {
    if (!authUser) {
      addToast({
        type: "error",
        title: "Not Authenticated",
        description: "Please sign in to save preferences",
      });
      return;
    }

    setPreferencesLoading(true);
    try {
      const { error } = await updateUser({
        data: {
          preferences: JSON.stringify(preferences),
        },
      });

      if (error) throw error;

      addToast({
        type: "success",
        title: "Preferences Saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Save Failed",
        description: error.message || "Failed to save preferences",
      });
    } finally {
      setPreferencesLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative">
      {/* Futuristic Security Grid */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-md border-b border-cyan-500/20 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold font-mono tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500">
                SYSTEM PROFILE CONFIGURATION
              </span>
            </h1>
          </div>
        </div>
      </div>

      <PageContainer variant="standard">
        <div className="max-w-4xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-900/50 backdrop-blur-md border border-cyan-500/20 rounded-lg">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 border border-transparent font-mono tracking-wider"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 border border-transparent font-mono tracking-wider"
              >
                Security
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 border border-transparent font-mono tracking-wider"
              >
                Billing
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 border border-transparent font-mono tracking-wider"
              >
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="company"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 border border-transparent font-mono tracking-wider"
              >
                Company
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <GlassCard variant="command" className="rounded-xl p-1 border border-cyan-500/20" glow={true}>
                <div className="p-6 border-b border-cyan-500/20">
                  <h2 className="text-2xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500">
                    Profile Information
                  </h2>
                  <p className="text-cyan-300/80 text-sm font-mono mt-1">
                    Configure your personal details and account settings
                  </p>
                </div>
                <GlassCardContent className="p-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                        <AvatarFallback className="text-xl bg-cyan-950 text-cyan-300">
                          {user.firstName.charAt(0)}
                          {user.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          id="avatar-upload"
                          disabled={uploading}
                        />
                        <label htmlFor="avatar-upload">
                          <Button
                            size="sm"
                            className="rounded-full w-8 h-8 p-0 cursor-pointer"
                            variant="secondary"
                            disabled={uploading}
                            asChild
                          >
                            <span>
                              <Camera className="h-4 w-4" />
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-cyan-300/80">{user.role}</p>
                      <p className="text-sm text-cyan-300/80">
                        Member since{" "}
                        {new Date(user.joinedDate).toLocaleDateString()}
                      </p>
                      {user.avatar && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAvatarRemove}
                          disabled={uploading}
                          className="mt-2 text-red-400 border-red-500/30 hover:bg-red-950/30 font-mono"
                        >
                          Remove Photo
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          value={user.firstName}
                          onChange={(e) =>
                            handleInputChange("firstName", e.target.value)
                          }
                          className="pl-10 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={user.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={user.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="pl-10 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={user.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="pl-10 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          value={user.company}
                          onChange={(e) =>
                            handleInputChange("company", e.target.value)
                          }
                          className="pl-10 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={user.location}
                          onChange={(e) =>
                            handleInputChange("location", e.target.value)
                          }
                          className="pl-10 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-4">
                    <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/30 font-mono">Cancel</Button>
                    <Button
                      onClick={handleSave}
                      variant="neonHighlight"
                      size="lg"
                      className="font-mono tracking-wider"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <GlassCard variant="command" className="rounded-xl p-1 border border-cyan-500/20" glow={true}>
                <div className="p-6 border-b border-cyan-500/20">
                  <h2 className="text-2xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500">
                    <Shield className="h-5 w-5 mr-2 inline-block" />
                    Security Settings
                  </h2>
                  <p className="text-cyan-300/80 text-sm font-mono mt-1">
                    Configure authentication and access controls
                  </p>
                </div>
                <GlassCardContent className="p-6 space-y-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <h3 className="text-lg font-semibold">Change Password</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          className="border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          className="border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                          minLength={6}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          value={passwordForm.confirmNewPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmNewPassword: e.target.value,
                            }))
                          }
                          className="border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="neonHighlight"
                      size="lg"
                      className="font-mono tracking-wider"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add an extra layer of security to your account by enabling
                      two-factor authentication.
                    </p>
                    <Button variant="outline" className="border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/30 font-mono">
                      <Key className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <GlassCard variant="command" className="rounded-xl p-1 border border-cyan-500/20" glow={true}>
                <div className="p-6 border-b border-cyan-500/20">
                  <h2 className="text-2xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500">
                    <CreditCard className="h-5 w-5 mr-2 inline-block" />
                    Billing & Usage
                  </h2>
                  <p className="text-cyan-300/80 text-sm font-mono mt-1">
                    Manage subscription, usage, and payment settings
                  </p>
                </div>
                <GlassCardContent className="p-6">
                  {subscriptionLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                      <p className="text-cyan-300/80 mt-2">
                        Loading subscription details...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Current Plan */}
                      <div className="bg-cyan-950/30 border border-cyan-500/20 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Current Plan: {subscription?.plan || "Free"}
                        </h3>
                        {subscription?.subscription ? (
                          <div className="space-y-2">
                            <p className="text-muted-foreground">
                              Status:{" "}
                              <span className="capitalize">
                                {subscription.subscription!.status}
                              </span>
                            </p>
                            <p className="text-muted-foreground">
                              ${subscription.subscription!.amount}/
                              {subscription.subscription!.interval}
                            </p>
                            <p className="text-muted-foreground">
                              Next billing:{" "}
                              {new Date(
                                subscription.subscription!.current_period_end *
                                  1000,
                              ).toLocaleDateString()}
                            </p>
                            {subscription.subscription!.cancel_at_period_end && (
                              <p className="text-red-400 font-semibold">
                                Subscription will cancel at the end of current
                                period
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-primary">
                            You have used {user.calculationsUsed} of{" "}
                            {user.calculationsLimit} calculations this month.
                          </p>
                        )}
                      </div>

                      {/* Billing Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subscription?.subscription ? (
                          <Button
                            onClick={openCustomerPortal}
                            variant="neonHighlight"
                            size="lg"
                            className="justify-start font-mono tracking-wider"
                            disabled={portalLoading}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {portalLoading
                              ? "Loading..."
                              : "Manage Subscription"}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => navigate("/pricing")}
                            variant="neonHighlight"
                            size="lg"
                            className="justify-start font-mono tracking-wider"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Upgrade Plan
                          </Button>
                        )}
                        <Button variant="outline" className="justify-start border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/30 font-mono">
                          <Calendar className="h-4 w-4 mr-2" />
                          View Billing History
                        </Button>
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="font-semibold text-red-400 mb-2">
                          Danger Zone
                        </h4>
                        <p className="text-muted-foreground mb-4">
                          Once you delete your account, there is no going back.
                          Please be certain.
                        </p>
                        <Button variant="destructive" className="font-mono tracking-wider">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <GlassCard variant="command" className="rounded-xl p-1 border border-cyan-500/20" glow={true}>
                <div className="p-6 border-b border-cyan-500/20">
                  <h2 className="text-2xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500">
                    <Bell className="h-5 w-5 mr-2 inline-block" />
                    Preferences
                  </h2>
                  <p className="text-cyan-300/80 text-sm font-mono mt-1">
                    Configure notification and system preferences
                  </p>
                </div>
                <GlassCardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">
                          Email notifications for calculation results
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.notifications.emailResults}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                emailResults: e.target.checked,
                              },
                            }))
                          }
                          className="rounded border-cyan-500/30 text-cyan-400 focus:ring-cyan-500/50"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">
                          Weekly usage summary
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.notifications.weeklyUsage}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                weeklyUsage: e.target.checked,
                              },
                            }))
                          }
                          className="rounded border-cyan-500/30 text-cyan-400 focus:ring-cyan-500/50"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">
                          Product updates and news
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.notifications.productUpdates}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                productUpdates: e.target.checked,
                              },
                            }))
                          }
                          className="rounded border-cyan-500/30 text-cyan-400 focus:ring-cyan-500/50"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">Security alerts</span>
                        <input
                          type="checkbox"
                          checked={preferences.notifications.securityAlerts}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                securityAlerts: e.target.checked,
                              },
                            }))
                          }
                          className="rounded border-cyan-500/30 text-cyan-400 focus:ring-cyan-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Default Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultUnits">
                          Default Temperature Units
                        </Label>
                        <Select
                          value={preferences.defaultUnits.temperature}
                          onValueChange={(value) =>
                            setPreferences((prev) => ({
                              ...prev,
                              defaultUnits: {
                                ...prev.defaultUnits,
                                temperature: value,
                              },
                            }))
                          }
                        >
                          <SelectTrigger className="border border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-500/50 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="celsius">
                              Celsius (°C)
                            </SelectItem>
                            <SelectItem value="fahrenheit">
                              Fahrenheit (°F)
                            </SelectItem>
                            <SelectItem value="kelvin">Kelvin (K)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultPressure">
                          Default Pressure Units
                        </Label>
                        <Select
                          value={preferences.defaultUnits.pressure}
                          onValueChange={(value) =>
                            setPreferences((prev) => ({
                              ...prev,
                              defaultUnits: {
                                ...prev.defaultUnits,
                                pressure: value,
                              },
                            }))
                          }
                        >
                          <SelectTrigger className="border border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-500/50 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kpa">kPa</SelectItem>
                            <SelectItem value="bar">bar</SelectItem>
                            <SelectItem value="psi">psi</SelectItem>
                            <SelectItem value="mpa">MPa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/30 font-mono"
                      onClick={() => {
                        setPreferences({
                          notifications: {
                            emailResults: true,
                            weeklyUsage: true,
                            productUpdates: false,
                            securityAlerts: true,
                          },
                          defaultUnits: {
                            temperature: "celsius",
                            pressure: "kpa",
                          },
                        });
                      }}
                    >
                      Reset to Defaults
                    </Button>
                    <Button
                      variant="neonHighlight"
                      size="lg"
                      className="font-mono tracking-wider"
                      onClick={handlePreferencesSave}
                      disabled={preferencesLoading}
                    >
                      {preferencesLoading ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company" className="space-y-6">
              <CompanySettings />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </div>
  );
}
