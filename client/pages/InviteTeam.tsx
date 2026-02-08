import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  Users,
  Copy,
  Check,
  Clock,
  Shield,
  Wrench,
  User,
  AlertCircle,
  Loader2,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const roleOptions = [
  {
    value: "admin",
    label: "Admin",
    icon: Shield,
    description: "Full access to all features",
  },
  {
    value: "manager",
    label: "Manager",
    icon: Users,
    description: "Can manage team and jobs",
  },
  {
    value: "tech",
    label: "Technician",
    icon: Wrench,
    description: "Can view and update jobs",
  },
  {
    value: "client",
    label: "Client",
    icon: User,
    description: "Can view their own jobs",
  },
];

export default function InviteTeam() {
  const { user, activeCompany } = useSupabaseAuth();
  const navigate = useNavigate();

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    tier: string;
    seat_limit: number;
    seat_usage: number;
    available: number;
  } | null>(null);

  // Form state
  const [role, setRole] = useState("tech");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [maxUses, setMaxUses] = useState(1);

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!activeCompany) return;
      const { data } = await supabase.rpc("get_company_subscription", {
        p_company_id: activeCompany.company_id,
      });
      if (data) {
        setSubscriptionInfo(data);
      }
    };
    fetchSubscription();
  }, [activeCompany]);

  useEffect(() => {
    // Redirect if no active company
    if (!activeCompany && !user) {
      navigate("/signin");
    }
  }, [activeCompany, user, navigate]);

  const handleCreateInvite = async () => {
    if (!activeCompany) {
      setError("No company selected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data, error } = await supabase.rpc("create_invitation_link", {
        p_company_id: activeCompany.company_id,
        p_role: role,
        p_expires_at: expiresAt.toISOString(),
        p_max_uses: maxUses,
      });

      if (error) {
        console.error("Create invite error:", error);
        setError(error.message || "Failed to create invite");
        return;
      }

      console.log("Invite created:", data);
      setGeneratedCode(data?.slug);
      setSuccess(true);
    } catch (err: any) {
      console.error("Exception creating invite:", err);
      setError(err.message || "Failed to create invite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedCode) return;

    const inviteLink = `${window.location.origin}/invite/${generatedCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedCode(null);
    setSuccess(false);
    setRole("tech");
    setExpiresInDays(30);
    setMaxUses(1);
  };

  if (!activeCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Invite Team Members</h1>
        <p className="text-muted-foreground mt-2">
          Create invite codes to add team members to{" "}
          <span className="font-semibold">{activeCompany.company_name}</span>
        </p>
      </div>

      {/* Subscription Info */}
      {subscriptionInfo && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Seat Usage</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionInfo.tier.charAt(0).toUpperCase() +
                      subscriptionInfo.tier.slice(1)}{" "}
                    Plan
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {subscriptionInfo.seat_usage} / {subscriptionInfo.seat_limit}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscriptionInfo.available} seats available
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  subscriptionInfo.seat_usage >= subscriptionInfo.seat_limit
                    ? "bg-red-500"
                    : subscriptionInfo.seat_usage >=
                        subscriptionInfo.seat_limit * 0.8
                      ? "bg-yellow-500"
                      : "bg-green-500",
                )}
                style={{
                  width: `${Math.min((subscriptionInfo.seat_usage / subscriptionInfo.seat_limit) * 100, 100)}%`,
                }}
              />
            </div>
            {subscriptionInfo.seat_usage >= subscriptionInfo.seat_limit && (
              <div className="mt-3 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span>
                  You've reached your seat limit. Upgrade to add more team
                  members.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {success && generatedCode ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              Invitation Link Generated
            </CardTitle>
            <CardDescription>
              Share this link with the person you want to invite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted font-mono text-center text-2xl tracking-widest">
              {generatedCode}
            </div>

            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/invite/${generatedCode}`}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopyLink} className="flex-1">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <Plus className="w-4 h-4 mr-2" />
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Create Invitation Link</CardTitle>
            <CardDescription>
              Generate a new invitation link with specific permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleOptions.find((r) => r.value === role)?.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expires In</Label>
                <Select
                  value={expiresInDays.toString()}
                  onValueChange={(v) => setExpiresInDays(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={maxUses}
                  onChange={(e) =>
                    setMaxUses(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>
            </div>



            <Button
              className="w-full"
              size="lg"
              onClick={handleCreateInvite}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Generate Invite Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-primary">1</span>
              </div>
              <h3 className="font-medium">Create Invite</h3>
              <p className="text-sm text-muted-foreground">
                Generate a code with specific role and expiration
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-primary">2</span>
              </div>
              <h3 className="font-medium">Share Link</h3>
              <p className="text-sm text-muted-foreground">
                Send the code or link to your team member
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-primary">3</span>
              </div>
              <h3 className="font-medium">They Join</h3>
              <p className="text-sm text-muted-foreground">
                They enter the code and join your company
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
