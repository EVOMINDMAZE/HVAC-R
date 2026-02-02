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
import { PageContainer } from "@/components/PageContainer";

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

// Removed AutomationSettings import as it is now managed per-client


// ... existing imports ...

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

    // Automation Toggles
    const [invoiceChaserEnabled, setInvoiceChaserEnabled] = useState(true);
    const [reviewHunterEnabled, setReviewHunterEnabled] = useState(true);

    // New Automation Config State
    // Automation config is now managed per-client


    // Automation Server Settings (n8n)
    const [n8nUrl, setN8nUrl] = useState("");
    const [n8nSecret, setN8nSecret] = useState("");

    // Fintech Settings (Trident Phase 1)
    const [financingEnabled, setFinancingEnabled] = useState(false);
    const [financingLink, setFinancingLink] = useState("");

    // Fetch existing data
    useEffect(() => {
        async function fetchCompany() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw error;
                }

                if (data) {
                    setCompanyName(data.name || "");
                    setWebsite(data.website || "");
                    setPrimaryColor(data.primary_color || "#000000");
                    setLogoUrl(data.logo_url);
                    setAlertPhone(data.alert_phone || "");

                    // Legacy alert config loading removed (now per-client)
                    if (data.alert_config) {
                        if (data.alert_config.message) setAlertMessage(data.alert_config.message);
                        if (data.alert_config.invoice_chaser_enabled !== undefined) setInvoiceChaserEnabled(data.alert_config.invoice_chaser_enabled);
                        // Check legacy or new structure for Review Hunter
                        if (data.alert_config.workflows?.review_request?.email === false && data.alert_config.workflows?.review_request?.sms === false) {
                            setReviewHunterEnabled(false);
                        } else if (data.alert_config.review_hunter_enabled !== undefined) {
                            setReviewHunterEnabled(data.alert_config.review_hunter_enabled);
                        }
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
            } catch (error: any) {
                console.error("Error fetching company:", error);
                toast({
                    title: "Error loading settings",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }

        fetchCompany();
    }, [user]);

    // Logo Upload Handler
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `company-logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            setLogoUrl(publicUrl);
            toast({
                title: "Logo uploaded",
                description: "Your company logo has been updated.",
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
                alert_config: {
                    message: alertMessage,
                    invoice_chaser_enabled: invoiceChaserEnabled,
                    review_hunter_enabled: reviewHunterEnabled,
                    // Maintain backward compatibility for review hunter detailed workflow if needed
                    workflows: {
                        review_request: {
                            email: reviewHunterEnabled,
                            sms: reviewHunterEnabled
                        }
                    }
                },

                n8n_config: { webhook_url: n8nUrl, webhook_secret: n8nSecret },
                financing_enabled: financingEnabled,
                financing_link: financingLink,
                updated_at: new Date().toISOString(),
            };

            // ... (rest of save logic) ...

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
        <PageContainer variant="standard">
            <div className="max-w-4xl mx-auto">
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
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-lg font-semibold">Alerts & Automations</Label>
                                    <CardDescription>
                                        Configure which notifications are sent via SMS and Email.
                                    </CardDescription>
                                </div>
                                {/* Keep the test button, but maybe move it or keep it here as a quick test */}
                                <TestAutomationButton phone={alertPhone} messageTemplate={alertMessage} />
                            </div>

                            <div className="pt-2">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="flex flex-col space-y-2 p-4 border rounded-lg bg-slate-50">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="review-hunter-toggle"
                                                checked={reviewHunterEnabled}
                                                onChange={(e) => setReviewHunterEnabled(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Label htmlFor="review-hunter-toggle" className="font-semibold cursor-pointer">Review Hunter</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6">
                                            Automatically send a review request (SMS/Email) when a Job is marked "Completed".
                                        </p>
                                    </div>

                                    <div className="flex flex-col space-y-2 p-4 border rounded-lg bg-slate-50">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="invoice-chaser-toggle"
                                                checked={invoiceChaserEnabled}
                                                onChange={(e) => setInvoiceChaserEnabled(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Label htmlFor="invoice-chaser-toggle" className="font-semibold cursor-pointer">Invoice Chaser</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6">
                                            Automatically send a gentle reminder email for unpaid invoices 3 days past due.
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 italic mt-4">
                                    Note: Client-specific notification preferences (e.g. Opt-out) override these global settings.
                                </p>
                            </div>


                            {/* Additional Legacy Config (Phone/Message Template) - keeping for System Alert config */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t mt-4 border-dashed">
                                <div className="space-y-2">
                                    <Label htmlFor="alert-phone">Alert Destination Phone</Label>
                                    <Input
                                        id="alert-phone"
                                        placeholder="+15551234567"
                                        value={alertPhone}
                                        onChange={(e) => setAlertPhone(e.target.value)}
                                        className="bg-white text-slate-900 border-slate-200"
                                    />
                                    <p className="text-xs text-gray-500">For System Alerts (Admin).</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="alert-msg">Review Request Template</Label>
                                    <Input
                                        id="alert-msg"
                                        placeholder="Review us..."
                                        value={alertMessage}
                                        onChange={(e) => setAlertMessage(e.target.value)}
                                        className="bg-white text-slate-900 border-slate-200"
                                    />
                                    <p className="text-xs text-gray-500">Default message for Review Requests.</p>
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
        </PageContainer>

    );
}

