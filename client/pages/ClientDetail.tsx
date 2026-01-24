import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Building, Activity, Plus, Zap, AlertTriangle, Snowflake, Fan, Thermometer, WifiOff, Wifi, Globe, Lock, Link as LinkIcon, Smartphone, Mail, CheckCircle, BarChart3, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { motion, AnimatePresence } from "framer-motion";
import { AutomationRuleForm } from "@/components/AutomationRuleForm";
import { GrantAccessDialog } from "@/components/GrantAccessDialog";

interface Client {
    id: string;
    name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    company_id: string;
}

interface Asset {
    id: string;
    name: string;
    type: string;
    serial_number: string;
    location_on_site?: string;
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
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export function ClientDetail() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { user } = useSupabaseAuth(); // Get current user
    const [client, setClient] = useState<Client | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);


    const [rules, setRules] = useState<Rule[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Asset State
    const [isAssetOpen, setIsAssetOpen] = useState(false);
    const [newAsset, setNewAsset] = useState({ name: '', type: 'Freezer', serial_number: '', location: '' });

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
    const [smartMethod, setSmartMethod] = useState<'connect' | 'invite' | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    async function fetchData() {
        try {
            setLoading(true);

            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            const { data: assetData, error: assetError } = await supabase
                .from('assets')
                .select('*')
                .eq('client_id', id)
                .order('created_at', { ascending: false });

            if (assetError) throw assetError;
            setAssets(assetData || []);

            if (assetData && assetData.length > 0) {
                const assetIds = assetData.map(a => a.id);
                const { data: rulesData } = await supabase
                    .from('automation_rules')
                    .select('*, assets(name)')
                    .in('asset_id', assetIds);
                setRules(rulesData || []);

                const { data: alertData } = await supabase
                    .from('rules_alerts')
                    .select('*')
                    .in('asset_id', assetIds)
                    .eq('status', 'new')
                    .order('created_at', { ascending: false });
                setAlerts(alertData || []);
            } else {
                setRules([]);
                setAlerts([]);
            }

        } catch (err) {
            console.error("Error fetching details:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateAsset() {
        if (!newAsset.name) return;
        try {
            const { error } = await supabase.from('assets').insert({
                client_id: id,
                name: newAsset.name,
                type: newAsset.type,
                serial_number: newAsset.serial_number,
                location_on_site: newAsset.location
            });
            if (error) throw error;

            toast({ title: "Asset created successfully", description: "You can now assign automation rules to this asset." });
            setIsAssetOpen(false);
            setNewAsset({ name: '', type: 'Freezer', serial_number: '', location: '' });
            fetchData();
        } catch (err: any) {
            toast({ title: "Error creating asset", description: err.message, variant: "destructive" });
        }
    }



    async function handleSimulateTelemetry(assetId: string, value: string) {
        if (!value) return;
        try {
            // 1. Insert Telemetry
            const { data: reading, error } = await supabase.from('telemetry_readings').insert({
                asset_id: assetId,
                reading_type: 'temperature',
                value: parseFloat(value),
                unit: 'F'
            }).select().single();

            if (error) throw error;
            toast({ title: "Telemetry Sent", description: `Simulated reading of ${value}°F recorded.` });

            // 2. Check for resulting Alert (Wait briefly for DB trigger)
            setTimeout(async () => {
                const { data: alert } = await supabase
                    .from('rules_alerts')
                    .select('*')
                    .eq('reading_id', reading.id)
                    .single();

                if (alert) {
                    toast({
                        title: "⚡ Automation Triggered!",
                        description: `${alert.message}`,
                        variant: "destructive", // Red alert style
                        duration: 5000
                    });
                    // Update local state
                    setAlerts(prev => [alert, ...prev]);
                    // Also refresh fetch mainly for rules status
                    fetchData();
                }
            }, 1000); // 1 second delay should be enough for the Postgres Trigger

        } catch (err: any) {
            toast({ title: "Simulation Failed", description: err.message, variant: "destructive" });
        }
    }

    async function handleConnectSmartAsset(methodArg?: 'connect' | 'invite', emailArg?: string) {
        if (!client || !smartProvider) return;

        const method = methodArg || smartMethod;
        const email = emailArg || inviteEmail;

        try {
            // In a real app, 'connect' would trigger OAuth flow here.
            // For now, we simulate the result or setting up the invite.

            const status = method === 'connect' ? 'active' : 'pending_invite';
            const emailToSend = method === 'invite' ? (email || client?.contact_email) : null;

            const { error } = await supabase.from('integrations').insert({
                client_id: client.id,
                provider: smartProvider,
                status: status,
                invited_email: emailToSend,
                metadata: {
                    source: 'web_wizard',
                    created_by: 'student_app',
                    sender_email: user?.email
                }
            });

            if (error) throw error;

            toast({
                title: method === 'connect' ? "Integration Connected" : "Invitation Sent",
                description: method === 'connect'
                    ? `Successfully linked ${smartProvider} account.`
                    : `Invitation sent to ${emailToSend}.`,
                className: "bg-green-600 text-white border-none",
                // action: <CheckCircle className="text-white"/> 
            });

            // Reset Wizard
            setIsSmartWizardOpen(false);
            setSmartStep(1);
            setSmartProvider(null);
            setSmartMethod(null);
            setInviteEmail("");

        } catch (err: any) {
            toast({ title: "Integration Failed", description: err.message, variant: "destructive" });
        }
    }

    async function handleUpdateClient() {
        if (!client || !editForm.name) return;
        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    name: editForm.name,
                    contact_name: editForm.contact_name,
                    contact_email: editForm.contact_email,
                    contact_phone: editForm.contact_phone
                })
                .eq('id', client.id);

            if (error) throw error;

            toast({ title: "Client updated successfully" });
            setClient({ ...client, ...editForm } as Client);
            setIsEditOpen(false);
        } catch (err: any) {
            toast({ title: "Update failed", description: err.message, variant: "destructive" });
        }
    }

    const getAssetIcon = (type: string) => {
        switch (type) {
            case 'Freezer': return <Snowflake className="h-5 w-5 text-cyan-500" />;
            case 'Chiller': return <Snowflake className="h-5 w-5 text-blue-500" />;
            case 'HVAC': return <Fan className="h-5 w-5 text-indigo-500" />;
            case 'Sensor': return <WifiOff className="h-5 w-5 text-purple-500" />;
            default: return <Activity className="h-5 w-5 text-slate-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-8">
            {/* Top Nav */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
            >
                <Link to="/clients" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Clients
                </Link>
            </motion.div>

            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-xl shadow-blue-900/20 text-white"
            >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                            <Building className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-blue-100">
                                <span className="flex items-center gap-1.5 bg-blue-500/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-blue-400/30">
                                    {client.contact_name}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm opacity-80">
                                    {client.contact_email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
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
                            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                            onClick={() => setIsInviteOpen(true)}
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Invite User
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-0 transition-all font-medium"
                            onClick={() => setIsSmartWizardOpen(true)}
                        >
                            <Wifi className="h-4 w-4 mr-2" />
                            Add Smart Asset
                        </Button>

                        <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-lg border-0 font-semibold transition-all hover:scale-105 active:scale-95">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Asset
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Register New Asset</DialogTitle>
                                    <DialogDescription>Add a new piece of equipment to track.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Asset Name</Label>
                                        <Input value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} placeholder="e.g. Walk-in Cooler 1" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select value={newAsset.type} onValueChange={v => setNewAsset({ ...newAsset, type: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                            <Input value={newAsset.serial_number} onChange={e => setNewAsset({ ...newAsset, serial_number: e.target.value })} placeholder="Optional" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateAsset}>Register Asset</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Decorative Circles */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/30 rounded-full blur-3xl" />

                {/* Invite Dialog */}
                {client && (
                    <GrantAccessDialog
                        open={isInviteOpen}
                        onOpenChange={setIsInviteOpen}
                        clientId={client.id}
                    />
                )}

                {/* Edit Client Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Client Details</DialogTitle>
                            <DialogDescription>Update contact information for this client.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Client / Business Name</Label>
                                <Input
                                    value={editForm.name || ''}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Person</Label>
                                <Input
                                    value={editForm.contact_name || ''}
                                    onChange={e => setEditForm({ ...editForm, contact_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={editForm.contact_email || ''}
                                        onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={editForm.contact_phone || ''}
                                        onChange={e => setEditForm({ ...editForm, contact_phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateClient}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                        <BarChart3 className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assets.length}</div>
                        <p className="text-xs text-slate-500 mt-1">Units monitored via IoT</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</div>
                        <p className="text-xs text-slate-500 mt-1">Automation triggers enabled</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        {alerts.length > 0 ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${alerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {alerts.length > 0 ? `${alerts.length} Alerts` : 'Healthy'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {alerts.length > 0 ? 'Requires attention' : 'No critical alerts'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="assets" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <TabsTrigger value="assets" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Assets</TabsTrigger>
                    <TabsTrigger value="automations" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Automations</TabsTrigger>
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
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No assets found</h3>
                                <p className="text-slate-500 mt-1 max-w-sm mb-6">
                                    Get started by adding equipment to track. You need assets before you can set up automation rules.
                                </p>
                                <Button onClick={() => setIsAssetOpen(true)}>Create First Asset</Button>
                            </motion.div>
                        ) : (
                            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assets.map(asset => (
                                    <motion.div key={asset.id} variants={item}>
                                        <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 group">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                                        {getAssetIcon(asset.type)}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="font-semibold text-slate-900 dark:text-white truncate">{asset.name}</div>
                                                        <div className="text-xs text-slate-500 truncate">SN: {asset.serial_number || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900">{asset.type}</Badge>
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
                                                            <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                                Simulate Data
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-4">
                                                            <div className="space-y-4">
                                                                <div className="space-y-1">
                                                                    <h4 className="font-medium text-sm">Send Telemetry</h4>
                                                                    <p className="text-xs text-slate-400">Insert a mock reading for this device.</p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Input id={`sim-${asset.id}`} placeholder="Temp (F)" type="number" className="h-8 text-sm" />
                                                                    <Button size="sm" className="h-8" onClick={() => {
                                                                        const val = (document.getElementById(`sim-${asset.id}`) as HTMLInputElement)?.value;
                                                                        handleSimulateTelemetry(asset.id, val);
                                                                    }}>Send</Button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Button variant="outline" size="sm" className="h-7 text-xs border-green-200 text-green-700 bg-green-50 hover:bg-green-100" onClick={() => handleSimulateTelemetry(asset.id, "35")}>
                                                                        Normal (35°F)
                                                                    </Button>
                                                                    <Button variant="outline" size="sm" className="h-7 text-xs border-red-200 text-red-700 bg-red-50 hover:bg-red-100" onClick={() => handleSimulateTelemetry(asset.id, "45")}>
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
                </TabsContent>

                <TabsContent value="automations" className="mt-0 space-y-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Automation Rules</h2>
                            <p className="text-sm text-slate-500">Configure triggers and alerts for your assets.</p>
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
                                    <DialogDescription>Define what happens when an asset reports specific data.</DialogDescription>
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
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No automation rules</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Configuring rules allows the system to alert you 24/7 when things go wrong.</p>
                            <Button variant="link" onClick={() => setIsRuleOpen(true)} className="mt-2 text-blue-600">Create your first rule</Button>
                        </motion.div>
                    ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                            {rules.map(rule => (
                                <motion.div key={rule.id} variants={item} className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${rule.trigger_type.includes('high') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {rule.trigger_type.includes('high') ? <Thermometer className="h-5 w-5" /> : <Snowflake className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                If {(rule.assets as any)?.name} {rule.trigger_type === 'temperature_high' ? 'exceeds' : 'drops below'} {rule.threshold_value}°
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <Badge variant="outline" className="text-xs font-normal text-slate-500 border-slate-200">
                                                    {rule.action_type === 'sms' ? <Smartphone className="h-3 w-3 mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
                                                    {rule.action_type.toUpperCase()}
                                                </Badge>
                                                <span className="text-xs text-slate-400">Updated recently</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={rule.is_active ? 'default' : 'secondary'} className={rule.is_active ? "bg-green-500 hover:bg-green-600" : ""}>
                                            {rule.is_active ? 'Active' : 'Paused'}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                                            <AlertTriangle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </TabsContent>
            </Tabs>


            {/* Smart Asset Wizard Dialog */}
            <Dialog open={isSmartWizardOpen} onOpenChange={setIsSmartWizardOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Wifi className="w-6 h-6 text-indigo-600" />
                            Connect Smart Equipment
                        </DialogTitle>
                        <DialogDescription>
                            Link existing smart thermostats or sensors directly to ThermoNeural.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        {smartStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-4">Select Manufacturer</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        'Honeywell', 'Tuya Smart', 'SmartThings',
                                        'Ecobee', 'Nest', 'Emerson Sensi',
                                        'Sensibo', 'Daikin', 'Carrier',
                                        'Lennox', 'Generic'
                                    ].map((brand) => (
                                        <div
                                            key={brand}
                                            onClick={() => {
                                                setSmartProvider(brand);
                                                setSmartStep(2);
                                            }}
                                            className="cursor-pointer group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 dark:border-slate-800 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30 transition-all"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Globe className="w-6 h-6" />
                                            </div>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{brand}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {smartStep === 2 && (
                            <div className="space-y-6">
                                <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => setSmartStep(1)}>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Brands
                                </Button>

                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Connect {smartProvider}</h3>
                                    <p className="text-slate-500">How would you like to authenticate?</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div
                                        onClick={() => {
                                            setSmartMethod('connect');
                                            handleConnectSmartAsset(); // Simulate instant connect
                                        }}
                                        className="cursor-pointer p-6 rounded-xl border border-slate-200 hover:border-indigo-600 hover:shadow-md transition-all text-center space-y-3"
                                    >
                                        <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold">I have the Login</h4>
                                        <p className="text-sm text-slate-500">Log in immediately on this device.</p>
                                    </div>

                                    <div
                                        onClick={() => {
                                            setInviteEmail(client?.contact_email || "");
                                            setSmartStep(3);
                                        }}
                                        className="cursor-pointer p-6 rounded-xl border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all text-center space-y-3"
                                    >
                                        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <LinkIcon className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold">Invite Client</h4>
                                        <p className="text-sm text-slate-500">Send a magic link to the owner.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {smartStep === 3 && (
                            <div className="space-y-6">
                                <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => setSmartStep(2)}>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Methods
                                </Button>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-blue-600 mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900">Send Invitation</h4>
                                            <p className="text-sm text-blue-700">We will email a secure link to the client to authorize {smartProvider}.</p>
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
                                    <Button onClick={() => {
                                        handleConnectSmartAsset('invite', inviteEmail || client?.contact_email);
                                    }} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        Send Invite
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
