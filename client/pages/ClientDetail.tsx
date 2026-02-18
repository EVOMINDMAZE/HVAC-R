import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Activity,
  Plus,
  Zap,
  AlertTriangle,
  Snowflake,
  Fan,
  Thermometer,
  WifiOff,
  Wifi,
  Globe,
  Lock,
  Link as LinkIcon,
  Smartphone,
  Mail,
  CheckCircle,
  BarChart3,
  Edit,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { AutomationRuleForm } from "@/components/AutomationRuleForm";
import { GrantAccessDialog } from "@/components/GrantAccessDialog";
import { SellingPointsCard } from "@/components/shared/SellingPointsCard";

interface Client {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_id: string;
  notification_preferences?: {
    sms_enabled: boolean;
    email_enabled: boolean;
  };
  zip_code?: string;
  address?: string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  serial_number: string;
  location_on_site?: string;
  install_date?: string;
  refrigerant_type?: string;
  last_reading?: { value: number; unit: string; timestamp: string };
}

interface Rule {
  id: string;
  asset_id: string;
  trigger_type: string;
  threshold_value: number;
  action_type: string;
  is_active: boolean;
  assets?: Asset;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSupabaseAuth(); // Get current user
  const [client, setClient] = useState<Client | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [rules, setRules] = useState<Rule[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Asset State
  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    type: "Freezer",
    serial_number: "",
    location: "",
    install_date: "",
  });

  // Add Rule State
  const [isRuleOpen, setIsRuleOpen] = useState(false);

  // Add Invite State
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Edit Client State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  // Smart Asset Wizard State
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false);
  const [smartStep, setSmartStep] = useState(1);
  const [smartProvider, setSmartProvider] = useState<string | null>(null);
  const [smartMethod, setSmartMethod] = useState<"connect" | "invite" | null>(
    null,
  );
  const [inviteEmail, setInviteEmail] = useState("");

  // Edit Asset State
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    sms_enabled: true,
    email_enabled: true,
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [forceSend, setForceSend] = useState(false);
  const [isSendingManual, setIsSendingManual] = useState(false);
  const isValidUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  useEffect(() => {
    if (!id) return;
    if (!isValidUuid(id)) {
      setLoading(false);
      setClient(null);
      return;
    }
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Load notification preferences
      const prefs = clientData.notification_preferences || {
        sms_enabled: true,
        email_enabled: true,
      };
      setNotifPrefs(prefs);

      // Fetch Assets
      const { data: assetData, error: assetError } = await supabase
        .from("assets")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      if (assetError) throw assetError;

      // Fetch Latest Readings for these assets
      let assetsWithReadings = assetData || [];
      if (assetsWithReadings.length > 0) {
        const assetIds = assetsWithReadings.map((a) => a.id);

        // We fetch the latest reading for each asset.
        // A simple way is to fetch all recent readings for these assets and pick the latest in JS.
        const { data: readings } = await supabase
          .from("telemetry_readings")
          .select("asset_id, value, unit, timestamp")
          .in("asset_id", assetIds)
          .order("timestamp", { ascending: false }); // Global descending

        // Map latest reading to asset
        assetsWithReadings = assetsWithReadings.map((asset) => {
          const reading = readings?.find((r) => r.asset_id === asset.id);
          return {
            ...asset,
            last_reading: reading
              ? {
                  value: reading.value,
                  unit: reading.unit,
                  timestamp: reading.timestamp,
                }
              : undefined,
          };
        });

        // Fetch Rules & Alerts
        const { data: rulesData } = await supabase
          .from("automation_rules")
          .select("*, assets(name)")
          .in("asset_id", assetIds);
        setRules(rulesData || []);

        const { data: alertData } = await supabase
          .from("rules_alerts")
          .select("*")
          .in("asset_id", assetIds)
          .eq("status", "new")
          .order("created_at", { ascending: false });
        setAlerts(alertData || []);
      } else {
        setRules([]);
        setAlerts([]);
      }

      setAssets(assetsWithReadings);
    } catch (err) {
      console.error("Error fetching details:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAsset() {
    if (!newAsset.name) return;
    try {
      const { error } = await supabase.from("assets").insert({
        client_id: id,
        name: newAsset.name,
        type: newAsset.type,
        serial_number: newAsset.serial_number,
        location_on_site: newAsset.location,
        install_date: newAsset.install_date,
      });
      if (error) throw error;

      toast({
        title: "Asset created successfully",
        description: "You can now assign automation rules to this asset.",
      });
      setIsAssetOpen(false);
      setNewAsset({
        name: "",
        type: "Freezer",
        serial_number: "",
        location: "",
        install_date: "",
      });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error creating asset",
        description: err.message,
        variant: "destructive",
      });
    }
  }
  async function handleUpdateAsset() {
    if (!editingAsset) return;
    try {
      const { error } = await supabase
        .from("assets")
        .update({
          name: editingAsset.name,
          type: editingAsset.type,
          serial_number: editingAsset.serial_number,
          location_on_site: editingAsset.location_on_site,
          install_date: editingAsset.install_date,
        })
        .eq("id", editingAsset.id);

      if (error) throw error;

      toast({
        title: "Asset Updated",
        description: `Successfully updated ${editingAsset.name}.`,
      });
      setIsEditAssetOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleSimulateTelemetry(assetId: string, value: string) {
    if (!value) return;
    try {
      // 1. Insert Telemetry
      const { data: reading, error } = await supabase
        .from("telemetry_readings")
        .insert({
          asset_id: assetId,
          reading_type: "temperature",
          value: parseFloat(value),
          unit: "F",
        })
        .select()
        .single();

      if (error) throw error;
      toast({
        title: "Telemetry Sent",
        description: `Simulated reading of ${value}°F recorded.`,
      });

      // 2. Check for resulting Alert (Wait briefly for DB trigger)
      setTimeout(async () => {
        const { data: alert } = await supabase
          .from("rules_alerts")
          .select("*")
          .eq("reading_id", reading.id)
          .single();

        if (alert) {
          toast({
            title: "⚡ Automation Triggered!",
            description: `${alert.message}`,
            variant: "destructive", // Red alert style
            duration: 5000,
          });
          // Update local state
          setAlerts((prev) => [alert, ...prev]);
          // Also refresh fetch mainly for rules status
          fetchData();
        }
      }, 1000); // 1 second delay should be enough for the Postgres Trigger
    } catch (err: any) {
      toast({
        title: "Simulation Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  async function handleConnectSmartAsset(
    methodArg?: "connect" | "invite",
    emailArg?: string,
  ) {
    if (!client || !smartProvider) return;

    const method = methodArg || smartMethod;
    const email = emailArg || inviteEmail;

    try {
      const status = method === "connect" ? "active" : "pending_invite";
      const emailToSend =
        method === "invite" ? email || client?.contact_email : null;

      const { error } = await supabase.from("integrations").insert({
        client_id: client.id,
        provider: smartProvider,
        status: status,
        invited_email: emailToSend,
        metadata: {
          source: "web_wizard",
          created_by: "student_app",
          sender_email: user?.email,
        },
      });

      if (error) throw error;

      toast({
        title:
          method === "connect" ? "Integration Connected" : "Invitation Sent",
        description:
          method === "connect"
            ? `Successfully linked ${smartProvider} account.`
            : `Invitation sent to ${emailToSend}.`,
        className: "bg-green-600 text-white border-none",
      });

      setIsSmartWizardOpen(false);
      setSmartStep(1);
      setSmartProvider(null);
      setSmartMethod(null);
      setInviteEmail("");
    } catch (err: any) {
      toast({
        title: "Integration Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  async function handleUpdateClient() {
    if (!client || !editForm.name) return;
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: editForm.name,
          contact_name: editForm.contact_name,
          contact_email: editForm.contact_email,
          contact_phone: editForm.contact_phone,
          zip_code: editForm.zip_code,
        })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Client updated" });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  async function handleManualSend(workflowType: string) {
    if (!client) return;
    try {
      setIsSendingManual(true);

      const payload: any = {
        client_id: client.id,
        client_email: client.contact_email,
        client_phone: client.contact_phone,
        force_send: forceSend,
        _triggered_by: user?.email,
      };

      // Add workflow specific data
      if (workflowType === "client_invite") {
        payload.integration_id = "manual_trigger"; // Or fetch actual if needed
      }

      const { error } = await supabase.from("workflow_requests").insert({
        workflow_type: workflowType,
        user_id: user?.id,
        input_payload: payload,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: forceSend ? "Force Notification Queued" : "Notification Queued",
        description: `Sent ${workflowType.replace("_", " ")} trigger to queue.`,
        className: "bg-cyan-600 text-white border-none",
      });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingManual(false);
    }
  }

  async function handleUpdateNotificationPrefs() {
    if (!client) return;
    try {
      setIsSavingPrefs(true);
      const { error } = await supabase
        .from("clients")
        .update({ notification_preferences: notifPrefs })
        .eq("id", client.id);

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Client notification settings have been saved.",
        className: "bg-green-600 text-white border-none",
      });
      setClient({ ...client, notification_preferences: notifPrefs });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPrefs(false);
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "Freezer":
        return <Snowflake className="h-5 w-5 text-primary" />;
      case "Chiller":
        return <Snowflake className="h-5 w-5 text-primary" />;
      case "HVAC":
        return <Fan className="h-5 w-5 text-muted-foreground" />;
      case "Sensor":
        return <WifiOff className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-background p-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!client) return <div className="p-6">Client not found</div>;

  return (
    <PageContainer variant="standard">
      <div className="space-y-8">
        <Button
          variant="ghost"
          className="mb-2 pl-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => navigate("/dashboard/clients")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-foreground shadow-sm"
        >
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-secondary shadow-sm">
                <Building className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {client.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm text-foreground">
                    {client.contact_name}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    {client.contact_email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-border bg-background text-foreground hover:bg-secondary"
                onClick={() => {
                  setEditForm(client);
                  setIsEditOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="border-border bg-background text-foreground hover:bg-secondary"
                onClick={() => setIsInviteOpen(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Invite User
              </Button>
              <Button
                className="border border-border bg-secondary text-foreground shadow-sm transition-all hover:bg-secondary/70"
                onClick={() => setIsSmartWizardOpen(true)}
              >
                <Wifi className="h-4 w-4 mr-2" />
                Add Smart Asset
              </Button>

              <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
                <DialogTrigger asChild>
                  <Button className="font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Register New Asset</DialogTitle>
                    <DialogDescription>
                      Add a new piece of equipment to track.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Asset Name</Label>
                      <Input
                        value={newAsset.name}
                        onChange={(e) =>
                          setNewAsset({ ...newAsset, name: e.target.value })
                        }
                        placeholder="e.g. Walk-in Cooler 1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={newAsset.type}
                          onValueChange={(v) =>
                            setNewAsset({ ...newAsset, type: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Freezer">Freezer</SelectItem>
                            <SelectItem value="Chiller">Chiller</SelectItem>
                            <SelectItem value="HVAC">HVAC Unit</SelectItem>
                            <SelectItem value="Sensor">Sensor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Serial Number</Label>
                        <Input
                          value={newAsset.serial_number}
                          onChange={(e) =>
                            setNewAsset({
                              ...newAsset,
                              serial_number: e.target.value,
                            })
                          }
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Installation Date</Label>
                      <Input
                        type="date"
                        value={newAsset.install_date}
                        onChange={(e) =>
                          setNewAsset({
                            ...newAsset,
                            install_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateAsset}>Register Asset</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-secondary blur-3xl" />

          {client && (
            <GrantAccessDialog
              open={isInviteOpen}
              onOpenChange={setIsInviteOpen}
              clientId={client.id}
            />
          )}

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Client Details</DialogTitle>
                <DialogDescription>
                  Update contact information for this client.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Client / Business Name</Label>
                  <Input
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input
                    value={editForm.contact_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contact_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={editForm.contact_email || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          contact_email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editForm.contact_phone || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          contact_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Service ZIP Code</Label>
                  <Input
                    placeholder="e.g. 85001"
                    value={editForm.zip_code || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, zip_code: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateClient}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Intelligence Layer */}
          <div className="md:col-span-3">
            <SellingPointsCard
              context="client"
              data={{ client, equipment: assets }}
            />
          </div>

          <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Assets
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assets.length}</div>
              <p className="text-xs text-slate-500 mt-1">
                Units monitored via IoT
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Active Rules
              </CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rules.filter((r) => r.is_active).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Automation triggers enabled
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                System Status
              </CardTitle>
              {alerts.length > 0 ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${alerts.length > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {alerts.length > 0 ? `${alerts.length} Alerts` : "Healthy"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {alerts.length > 0
                  ? "Requires attention"
                  : "No critical alerts"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px] mb-6 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <TabsTrigger
              value="assets"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm transition-all duration-300"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="automations"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm transition-all duration-300"
            >
              Automations
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm transition-all duration-300"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="mt-0">
            <AnimatePresence mode="wait">
              {assets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    No assets found
                  </h3>
                  <p className="text-slate-500 mt-1 max-w-sm mb-6">
                    Get started by adding equipment to track. You need assets
                    before you can set up automation rules.
                  </p>
                  <Button onClick={() => setIsAssetOpen(true)}>
                    Create First Asset
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {assets.map((asset) => (
                    <motion.div key={asset.id} variants={item}>
                      <Card
                        data-testid="asset-card"
                        className="h-full border-slate-200/60 dark:border-slate-800 bg-card hover:shadow-xl hover:shadow-slate-900/5 hover:border-cyan-200 dark:hover:border-cyan-800 transition-all duration-300 group"
                      >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/20 transition-colors">
                              {getAssetIcon(asset.type)}
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-slate-900 dark:text-white truncate">
                                  {asset.name}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setEditingAsset(asset);
                                    setIsEditAssetOpen(true);
                                  }}
                                  aria-label="Edit Asset"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                SN: {asset.serial_number || "N/A"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {asset.last_reading ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xl font-bold text-slate-900 dark:text-white">
                                  {asset.last_reading.value.toFixed(1)}°
                                  {asset.last_reading.unit === "Fahrenheit"
                                    ? "F"
                                    : "F"}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Latest
                                </span>
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-slate-50 dark:bg-slate-900"
                              >
                                {asset.type}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                              </span>
                              Online
                            </span>

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                                >
                                  Simulate Data
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-4">
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <h4 className="font-medium text-sm">
                                      Send Telemetry
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                      Insert a mock reading for this device.
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      id={`sim-${asset.id}`}
                                      placeholder="Temp (F)"
                                      type="number"
                                      className="h-8 text-sm"
                                    />
                                    <Button
                                      size="sm"
                                      className="h-8"
                                      onClick={() => {
                                        const val = (
                                          document.getElementById(
                                            `sim-${asset.id}`,
                                          ) as HTMLInputElement
                                        )?.value;
                                        handleSimulateTelemetry(asset.id, val);
                                      }}
                                    >
                                      Send
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                                      onClick={() =>
                                        handleSimulateTelemetry(asset.id, "35")
                                      }
                                    >
                                      Normal (35°F)
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                                      onClick={() =>
                                        handleSimulateTelemetry(asset.id, "45")
                                      }
                                    >
                                      Alert (45°F)
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Asset</DialogTitle>
                  <DialogDescription>
                    Update the details of this equipment.
                  </DialogDescription>
                </DialogHeader>
                {editingAsset && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-asset-name">Asset Name</Label>
                      <Input
                        id="edit-asset-name"
                        value={editingAsset.name}
                        onChange={(e) =>
                          setEditingAsset({
                            ...editingAsset,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={editingAsset.type}
                          onValueChange={(v) =>
                            setEditingAsset({ ...editingAsset, type: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Freezer">Freezer</SelectItem>
                            <SelectItem value="Chiller">Chiller</SelectItem>
                            <SelectItem value="HVAC">HVAC Unit</SelectItem>
                            <SelectItem value="Sensor">Sensor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-asset-sn">Serial Number</Label>
                        <Input
                          id="edit-asset-sn"
                          value={editingAsset.serial_number || ""}
                          onChange={(e) =>
                            setEditingAsset({
                              ...editingAsset,
                              serial_number: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Installation Date</Label>
                      <Input
                        type="date"
                        value={editingAsset.install_date || ""}
                        onChange={(e) =>
                          setEditingAsset({
                            ...editingAsset,
                            install_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location on Site</Label>
                      <Input
                        value={editingAsset.location_on_site || ""}
                        onChange={(e) =>
                          setEditingAsset({
                            ...editingAsset,
                            location_on_site: e.target.value,
                          })
                        }
                        placeholder="e.g. Back Kitchen, Roof"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditAssetOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateAsset}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="automations" className="mt-0 space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Automation Rules
                </h2>
                <p className="text-sm text-slate-500">
                  Configure triggers and alerts for your assets.
                </p>
              </div>
              <Dialog open={isRuleOpen} onOpenChange={setIsRuleOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                    <Zap className="h-4 w-4 mr-2" /> New Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Automation Rule</DialogTitle>
                    <DialogDescription>
                      Define what happens when an asset reports specific data.
                    </DialogDescription>
                  </DialogHeader>
                  {client && (
                    <AutomationRuleForm
                      assets={assets}
                      companyId={client.company_id}
                      onSuccess={() => {
                        setIsRuleOpen(false);
                        fetchData();
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </motion.div>

            {rules.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50"
              >
                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  No automation rules
                </h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                  Configuring rules allows the system to alert you 24/7 when
                  things go wrong.
                </p>
                <Button
                  variant="link"
                  onClick={() => setIsRuleOpen(true)}
                  className="mt-2 text-cyan-600"
                >
                  Create your first rule
                </Button>
              </motion.div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {rules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    variants={item}
                    className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-full ${rule.trigger_type.includes("high") ? "bg-red-100 text-red-600" : "bg-cyan-100 text-cyan-600"}`}
                      >
                        {rule.trigger_type.includes("high") ? (
                          <Thermometer className="h-5 w-5" />
                        ) : (
                          <Snowflake className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          If {(rule.assets as any)?.name}{" "}
                          {rule.trigger_type === "temperature_high"
                            ? "exceeds"
                            : "drops below"}{" "}
                          {rule.threshold_value}°
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge
                            variant="outline"
                            className="text-xs font-normal text-slate-500 border-slate-200"
                          >
                            {rule.action_type === "sms" ? (
                              <Smartphone className="h-3 w-3 mr-1" />
                            ) : (
                              <Mail className="h-3 w-3 mr-1" />
                            )}
                            {rule.action_type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Updated recently
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={rule.is_active ? "default" : "secondary"}
                        className={
                          rule.is_active
                            ? "bg-green-500 hover:bg-green-600"
                            : ""
                        }
                      >
                        {rule.is_active ? "Active" : "Paused"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-0 space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan-600" />
                Notification Preferences
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage how this client receives alerts and updates.
              </p>

              <div className="mt-8 space-y-6 max-w-md">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <Label
                    htmlFor="email-notifications"
                    className="flex flex-col space-y-1 cursor-pointer"
                  >
                    <span className="font-semibold">Email Notifications</span>
                    <span className="font-normal text-sm text-slate-500">
                      Send alerts and job updates via email.
                    </span>
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={notifPrefs.email_enabled}
                    onCheckedChange={(checked) =>
                      setNotifPrefs((prev) => ({
                        ...prev,
                        email_enabled: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <Label
                    htmlFor="sms-notifications"
                    className="flex flex-col space-y-1 cursor-pointer"
                  >
                    <span className="font-semibold">SMS Notifications</span>
                    <span className="font-normal text-sm text-slate-500">
                      Send critical alerts directly to phone.
                    </span>
                  </Label>
                  <Switch
                    id="sms-notifications"
                    checked={notifPrefs.sms_enabled}
                    onCheckedChange={(checked) =>
                      setNotifPrefs((prev) => ({
                        ...prev,
                        sms_enabled: checked,
                      }))
                    }
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    onClick={handleUpdateNotificationPrefs}
                    disabled={isSavingPrefs}
                  >
                    {isSavingPrefs ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/30">
                <h4 className="text-sm font-semibold text-cyan-900 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Owner Override & Manual Actions
                </h4>
                <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-1">
                  These settings respect client privacy records. As an
                  administrator, you can override these preferences for critical
                  alerts or manual triggers.
                </p>

                <div className="mt-4 flex items-center justify-between p-3 rounded-md bg-white/50 dark:bg-slate-900/50 border border-cyan-200 dark:border-cyan-900/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Bypass Preferences
                    </Label>
                    <p className="text-[10px] text-cyan-600 dark:text-cyan-400">
                      Force send notifications even if opted out.
                    </p>
                  </div>
                  <Switch
                    checked={forceSend}
                    onCheckedChange={setForceSend}
                    className="data-[state=checked]:bg-cyan-600"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 bg-white dark:bg-slate-900 hover:bg-slate-50 border-cyan-200"
                    onClick={() => handleManualSend("client_invite")}
                    disabled={isSendingManual}
                  >
                    <LinkIcon className="h-3 w-3 mr-2" />
                    Send Portal Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 bg-white dark:bg-slate-900 hover:bg-slate-50 border-cyan-200"
                    onClick={() => handleManualSend("review_hunter")}
                    disabled={isSendingManual}
                  >
                    <Mail className="h-3 w-3 mr-2" />
                    Send Review Request
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        <Dialog open={isSmartWizardOpen} onOpenChange={setIsSmartWizardOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Wifi className="w-6 h-6 text-slate-600" />
                Connect Smart Equipment
              </DialogTitle>
              <DialogDescription>
                Link existing smart thermostats or sensors directly to
                ThermoNeural.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              {smartStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-4">
                    Select Manufacturer
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      "Honeywell",
                      "Tuya Smart",
                      "SmartThings",
                      "Ecobee",
                      "Nest",
                      "Emerson Sensi",
                      "Sensibo",
                      "Daikin",
                      "Carrier",
                      "Lennox",
                      "Generic",
                    ].map((brand) => (
                      <div
                        key={brand}
                        onClick={() => {
                          setSmartProvider(brand);
                          setSmartStep(2);
                        }}
                        className="cursor-pointer group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-slate-100 hover:border-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-950/30 transition-all"
                      >
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                          <Globe className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {brand}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {smartStep === 2 && (
                <div className="space-y-6">
                  <Button
                    variant="ghost"
                    className="pl-0 hover:bg-transparent"
                    onClick={() => setSmartStep(1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Brands
                  </Button>

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Connect {smartProvider}
                    </h3>
                    <p className="text-slate-500">
                      How would you like to authenticate?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => {
                        setSmartMethod("connect");
                        handleConnectSmartAsset(); // Simulate instant connect
                      }}
                      className="cursor-pointer p-6 rounded-xl border border-slate-200 hover:border-slate-600 hover:shadow-md transition-all text-center space-y-3"
                    >
                      <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold">I have the Login</h4>
                      <p className="text-sm text-slate-500">
                        Log in immediately on this device.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setInviteEmail(client?.contact_email || "");
                        setSmartStep(3);
                      }}
                      className="cursor-pointer p-6 rounded-xl border border-slate-200 hover:border-cyan-600 hover:shadow-md transition-all text-center space-y-3"
                    >
                      <div className="mx-auto w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600">
                        <LinkIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold">Invite Client</h4>
                      <p className="text-sm text-slate-500">
                        Send a magic link to the owner.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {smartStep === 3 && (
                <div className="space-y-6">
                  <Button
                    variant="ghost"
                    className="pl-0 hover:bg-transparent"
                    onClick={() => setSmartStep(2)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Methods
                  </Button>

                  <div className="space-y-4">
                    <div className="bg-cyan-50 p-4 rounded-lg flex items-start gap-3">
                      <Mail className="w-5 h-5 text-cyan-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-cyan-900">
                          Send Invitation
                        </h4>
                        <p className="text-sm text-cyan-700">
                          We will email a secure link to the client to authorize{" "}
                          {smartProvider}.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Client Email</Label>
                      <Input
                        placeholder="client@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={() => {
                        handleConnectSmartAsset(
                          "invite",
                          inviteEmail || client?.contact_email,
                        );
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      Send Invite
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
