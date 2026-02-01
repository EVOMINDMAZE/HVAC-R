import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "../lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { Loader2, Upload, Building2, Globe, Palette, Send } from "lucide-react";
import { useWorkflowTrigger } from "@/hooks/useWorkflowTrigger";

import { Check } from "lucide-react";

interface TestAutomationButtonProps {
    phone: string;
    messageTemplate: string;
}

function TestAutomationButton({ phone, messageTemplate }: TestAutomationButtonProps) {
    const { triggerWorkflow, isProcessing } = useWorkflowTrigger();
    const [showSuccess, setShowSuccess] = useState(false);

    const handleTest = () => {
        setShowSuccess(false);
        triggerWorkflow('whatsapp_alert', {
            message: messageTemplate || "Test Alert: Job Completed",
            phone: phone,
            timestamp: new Date().toISOString()
        }, () => {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        });
    };

    return (
        <Button
            variant={showSuccess ? "outline" : "outline"}
            className={showSuccess ? "border-green-500 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 transition-all duration-500" : ""}
            size="sm"
            onClick={handleTest}
            disabled={isProcessing}
        >
            {isProcessing ? (
                <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                </>
            ) : showSuccess ? (
                <>
                    <Check className="mr-2 h-3 w-3" />
                    Sent!
                </>
            ) : (
                <>
                    <Send className="mr-2 h-3 w-3" />
                    Test Alert
                </>
            )}
        </Button>
    );
}

export default function CompanySettings() {
    const { user } = useSupabaseAuth();
    console.log('CompanySettings PAGE MOUNTED');
    const { toast } = useToast();

    // Form State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [website, setWebsite] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#000000");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Alert Settings
    const [alertPhone, setAlertPhone] = useState("");
    const [alertMessage, setAlertMessage] = useState("Job {{id}} has been marked as complete.");

    // Automation Server Settings (n8n)
    const [n8nUrl, setN8nUrl] = useState("");
    const [n8nSecret, setN8nSecret] = useState("");

    // Fintech Settings (Trident Phase 1)
    const [financingEnabled, setFinancingEnabled] = useState(false);
    const [financingLink, setFinancingLink] = useState("");

    // Fetch existing data
    useEffect(() => {
        async function fetchCompany() {
            console.log("CompanySettings: fetchCompany start", { userId: user?.id });
            if (!user) {
                console.log("CompanySettings: No user, skipping.");
                return;
            }
            try {
                // First attempt: Get via user_id (Legacy/Owner check)
                console.log("CompanySettings: Attempting fetch by user_id...");
                let { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                // Second attempt: Get via user_roles if first attempt failed
                if (!data) {
                    console.log("CompanySettings: Not found by user_id, checking user_roles...");
                    const { data: roleData } = await supabase
                        .from('user_roles')
                        .select('company_id')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (roleData?.company_id) {
                        console.log(`CompanySettings: Found company_id ${roleData.company_id} in user_roles, fetching company...`);
                        const { data: companyData, error: companyError } = await supabase
                            .from('companies')
                            .select('*')
                            .eq('id', roleData.company_id)
                            .maybeSingle();

                        data = companyData;
                        error = companyError;
                    }
                }

                console.log("CompanySettings: Final fetch result", { data, error });

                if (error) {
                    console.error("Error fetching company:", error);
                }

                if (data) {
                    setCompanyName(data.name || "");
                    setWebsite(data.website || "");
                    setPrimaryColor(data.primary_color || "#000000");
                    setLogoUrl(data.logo_url);
                    setAlertPhone(data.alert_phone || "");
                    if (data.alert_config && data.alert_config.message) {
                        setAlertMessage(data.alert_config.message);
                    }
                    if (data.n8n_config) {
                        setN8nUrl(data.n8n_config.webhook_url || "");
                        setN8nSecret(data.n8n_config.webhook_secret || "");
                    }
                    if (data.financing_enabled !== undefined) {
                        setFinancingEnabled(data.financing_enabled);
                        setFinancingLink(data.financing_link || "");
                    }
                } else {
                    // Pre-fill with user info if no company exists yet
                    setCompanyName(user.user_metadata?.full_name || "");
                }
            } catch (error) {
                console.error("Error in fetchCompany:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCompany();
    }, [user]);

    // Handle Logo Upload
    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingLogo(true);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            if (!user) return;

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('company-assets')
                .getPublicUrl(filePath);

            setLogoUrl(publicUrl);
            toast({
                title: "Logo uploaded",
                description: "Your company logo has been uploaded successfully.",
            });

        } catch (error: any) {
            toast({
                title: "Upload failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUploadingLogo(false);
        }
    };

    // Handle Save
    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        try {
            // Upsert company details
            const updates = {
                user_id: user.id,
                name: companyName,
                website: website,
                primary_color: primaryColor,
                logo_url: logoUrl,
                alert_phone: alertPhone,
                alert_config: { message: alertMessage },
                n8n_config: { webhook_url: n8nUrl, webhook_secret: n8nSecret },
                financing_enabled: financingEnabled,
                financing_link: financingLink,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('companies')
                .upsert(updates, { onConflict: 'user_id' });

            if (error) throw error;

            toast({
                title: "Settings saved",
                description: "Your company profile has been updated.",
            });

        } catch (error: any) {
            toast({
                title: "Error saving settings",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container max-w-2xl py-10">
            <h1 className="text-3xl font-bold mb-6">Company Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>White-Label Configuration</CardTitle>
                    <CardDescription>
                        Customize how your business appears on generated reports and client portals.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Logo Section */}
                    <div className="space-y-2">
                        <Label>Company Logo</Label>
                        <div className="flex items-center gap-4">
                            <div className="border rounded-lg p-2 h-20 w-20 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <Building2 className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="logo-upload" className="cursor-pointer">
                                    <div className="flex items-center gap-2 border border-dashed border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-600">
                                        <Upload className="h-4 w-4" />
                                        {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                                    </div>
                                    <Input
                                        id="logo-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={uploadingLogo}
                                    />
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Recommended: PNG or SVG with transparent background.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Company Name</Label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="name"
                                placeholder="Acme HVAC Solutions"
                                className="pl-9"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="website"
                                placeholder="https://acme-hvac.com"
                                className="pl-9"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Primary Color */}
                    <div className="space-y-2">
                        <Label htmlFor="color">Brand Color</Label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Palette className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="color"
                                    placeholder="#000000"
                                    className="pl-9 font-mono"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                />
                            </div>
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="h-10 w-10 p-0 border rounded cursor-pointer overflow-hidden"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            This color will be used for headers and accents in your PDF reports.
                        </p>
                    </div>


                    {/* Alerts & Automations */}
                    <div className="space-y-4 pt-4 border-t">
                        <Label className="text-lg font-semibold">Alerts & Automations</Label>
                        <CardDescription>
                            Configure automated notifications sent to you or your team.
                        </CardDescription>

                        <div className="flex flex-col gap-4">
                            <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Job Completion Alert</p>
                                        <p className="text-sm text-gray-500">Configure the SMS/WhatsApp notification.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <TestAutomationButton phone={alertPhone} messageTemplate={alertMessage} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="alert-phone">Destination Phone Number</Label>
                                        <Input
                                            id="alert-phone"
                                            placeholder="+15551234567"
                                            value={alertPhone}
                                            onChange={(e) => setAlertPhone(e.target.value)}
                                            className="bg-white text-slate-900 border-slate-200"
                                        />
                                        <p className="text-xs text-gray-500">Include country code (e.g. +1 for US).</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="alert-msg">Message Template</Label>
                                        <Input
                                            id="alert-msg"
                                            placeholder="Job completed!"
                                            value={alertMessage}
                                            onChange={(e) => setAlertMessage(e.target.value)}
                                            className="bg-white text-slate-900 border-slate-200"
                                        />
                                        <p className="text-xs text-gray-500">Text sent to the recipient.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Automation Server Config */}
                    <div className="space-y-4 pt-4 border-t">
                        <Label className="text-lg font-semibold">Automation Server (n8n)</Label>
                        <CardDescription>
                            Connect your private n8n instance to handle advanced workflows.
                        </CardDescription>

                        <div className="grid grid-cols-1 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="n8n-url">Webhook URL</Label>
                                <Input
                                    id="n8n-url"
                                    placeholder="https://n8n.your-domain.com/webhook/..."
                                    value={n8nUrl}
                                    onChange={(e) => setN8nUrl(e.target.value)}
                                    className="bg-white text-slate-900 border-slate-200 font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500">The base URL for your n8n instance or specific webhook trigger.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="n8n-secret">Webhook Secret</Label>
                                <Input
                                    id="n8n-secret"
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    value={n8nSecret}
                                    onChange={(e) => setN8nSecret(e.target.value)}
                                    className="bg-white text-slate-900 border-slate-200 font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500">Security key to validate requests coming from this App.</p>
                            </div>
                        </div>
                    </div>

                    {/* Fintech Integration (ThermoPay) */}
                    <div className="space-y-4 pt-4 border-t">
                        <Label className="text-lg font-semibold flex items-center gap-2">
                            Fintech Integration 💳
                        </Label>
                        <CardDescription>
                            Offer financing to your customers directly on your PDF reports.
                        </CardDescription>

                        <div className="flex items-center space-x-2 my-2">
                            <input
                                type="checkbox"
                                id="financing-toggle"
                                checked={financingEnabled}
                                onChange={(e) => setFinancingEnabled(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="financing-toggle" className="font-medium cursor-pointer">
                                Enable Financing Links on PDFs
                            </Label>
                        </div>

                        {financingEnabled && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="financing-link">Financing Application URL</Label>
                                <Input
                                    id="financing-link"
                                    placeholder="https://wisetack.us/your-business/..."
                                    value={financingLink}
                                    onChange={(e) => setFinancingLink(e.target.value)}
                                    className="bg-white text-slate-900 border-slate-200"
                                />
                                <p className="text-xs text-gray-500">
                                    This link will be clickable on every Winterization & Maintenance Certificate.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Live Preview (Simulated) */}
                    <div className="space-y-2 pt-4 border-t">
                        <Label>Preview: PDF Header</Label>
                        <div
                            className="w-full h-16 rounded flex items-center px-6 relative overflow-hidden"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {/* Decorative angled slice just for fun/realism if we had it, keeping it simple for now */}
                            <div className="z-10 flex items-center gap-3">
                                {logoUrl ? (
                                    <div className="bg-white/90 p-1 rounded">
                                        <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                                    </div>
                                ) : null}
                                <span className="text-white font-bold text-lg drop-shadow-md">
                                    {companyName || "Your Company Name"}
                                </span>
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
