import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "../lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { Loader2, Upload, Building2, Globe, Palette, Send } from "lucide-react";
import { useWorkflowTrigger } from "@/hooks/useWorkflowTrigger";
import { PageContainer } from "@/components/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import { GoogleSheetConnect } from "../components/shared/GoogleSheetConnect";
import { Badge } from "@/components/ui/badge";
import { AppPageHeader } from "@/components/app/AppPageHeader";

interface TestAutomationButtonProps {
  phone: string;
  messageTemplate: string;
}

function TestAutomationButton({
  phone,
  messageTemplate,
}: TestAutomationButtonProps) {
  const { triggerWorkflow, isProcessing } = useWorkflowTrigger();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTest = () => {
    setShowSuccess(false);
    triggerWorkflow(
      "whatsapp_alert",
      {
        message: messageTemplate || "Test Alert: Job Completed",
        phone: phone,
        timestamp: new Date().toISOString(),
      },
      () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
    );
  };

  return (
    <Button
      variant={showSuccess ? "outline" : "outline"}
      className={
        showSuccess
          ? "border-green-500 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 transition-all duration-500"
          : ""
      }
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
  const { user, activeCompany } = useSupabaseAuth();
  console.log("CompanySettings PAGE MOUNTED", { activeCompany });
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [alertPhone, setAlertPhone] = useState("");
  const [alertMessage, setAlertMessage] = useState(
    "Job {{id}} has been marked as complete.",
  );

  const [invoiceChaserEnabled, setInvoiceChaserEnabled] = useState(true);
  const [reviewHunterEnabled, setReviewHunterEnabled] = useState(true);

  const [financingEnabled, setFinancingEnabled] = useState(false);
  const [financingLink, setFinancingLink] = useState("");

  const [timezone, setTimezone] = useState("America/New_York");
  const [dateFormat, setDateFormat] = useState("MM/dd/yyyy");
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState("0");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [jobCompleteAlerts, setJobCompleteAlerts] = useState(true);
  const [paymentReceivedAlerts, setPaymentReceivedAlerts] = useState(true);

  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [seatLimit, setSeatLimit] = useState(1);
  const [seatUsage, setSeatUsage] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState("active");

  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    async function fetchSettings() {
      if (!user || !activeCompany?.company_id) {
        setLoading(false);
        return;
      }
      try {
        let { data: subscriptionData, error: subError } = await supabase.rpc(
          "get_company_subscription",
          { p_company_id: activeCompany.company_id },
        );

        // Backward-compatible fallback for environments still using the legacy parameter name.
        if (subError?.code === "PGRST202") {
          const fallback = await supabase.rpc("get_company_subscription", {
            company_uuid: activeCompany.company_id,
          });
          subscriptionData = fallback.data;
          subError = fallback.error;
        }

        if (subError) throw subError;

        if (subscriptionData) {
          setSubscriptionTier(subscriptionData.subscription_tier || "free");
          setSeatLimit(subscriptionData.seat_limit || 1);
          setSeatUsage(subscriptionData.seat_usage || 0);
          setSubscriptionStatus(
            subscriptionData.subscription_status || "active",
          );
        }

        let { data: settingsData, error: settingsError } = await supabase.rpc(
          "get_company_settings",
          { p_company_id: activeCompany.company_id },
        );

        if (settingsError?.code === "PGRST202") {
          const fallback = await supabase.rpc("get_company_settings", {
            company_uuid: activeCompany.company_id,
          });
          settingsData = fallback.data;
          settingsError = fallback.error;
        }

        if (settingsError && settingsError.code !== "PGRST116")
          throw settingsError;

        if (settingsData && Object.keys(settingsData).length > 0) {
          setCompanyName(settingsData.name || activeCompany.company_name || "");
          setWebsite(settingsData.website || "");
          setPrimaryColor(settingsData.primary_color || "#000000");
          setLogoUrl(settingsData.logo_url);
          setAlertPhone(settingsData.alert_phone || "");
          setAlertMessage(
            settingsData.alert_message ||
              "Job {{id}} has been marked as complete.",
          );
          setInvoiceChaserEnabled(settingsData.invoice_chaser_enabled ?? true);
          setReviewHunterEnabled(settingsData.review_hunter_enabled ?? true);
          setFinancingEnabled(settingsData.financing_enabled ?? false);
          setFinancingLink(settingsData.financing_link || "");
          setTimezone(settingsData.timezone || "America/New_York");
          setDateFormat(settingsData.date_format || "MM/dd/yyyy");
          setCurrency(settingsData.currency || "USD");
          setTaxRate(settingsData.tax_rate?.toString() || "0");
          setEmailNotifications(settingsData.email_notifications ?? true);
          setSmsNotifications(settingsData.sms_notifications ?? true);
          setJobCompleteAlerts(settingsData.job_complete_alerts ?? true);
          setPaymentReceivedAlerts(
            settingsData.payment_received_alerts ?? true,
          );
        } else {
          setCompanyName(activeCompany.company_name || "");
        }
      } catch (error: any) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error loading settings",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [user, activeCompany]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("public")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("public").getPublicUrl(filePath);

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

  const handleSave = async () => {
    if (!user || !activeCompany?.company_id) return;
    setSaving(true);

    try {
      const settingsPayload = {
        name: companyName,
        website: website,
        primary_color: primaryColor,
        logo_url: logoUrl,
        alert_phone: alertPhone,
        alert_message: alertMessage,
        invoice_chaser_enabled: invoiceChaserEnabled,
        review_hunter_enabled: reviewHunterEnabled,
        financing_enabled: financingEnabled,
        financing_link: financingLink,
        timezone: timezone,
        date_format: dateFormat,
        currency: currency,
        tax_rate: parseFloat(taxRate) || 0,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
        job_complete_alerts: jobCompleteAlerts,
        payment_received_alerts: paymentReceivedAlerts,
      };

      let { error } = await supabase.rpc("update_company_settings", {
        p_company_id: activeCompany.company_id,
        p_settings: settingsPayload,
      });

      // Backward-compatible fallback for legacy function signatures.
      if (error?.code === "PGRST202") {
        const fallback = await supabase.rpc("update_company_settings", {
          company_uuid: activeCompany.company_id,
          ...settingsPayload,
        });
        error = fallback.error;
      }

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your company settings have been updated.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
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
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageContainer variant="standard" className="app-stack-24">
      <div className="max-w-5xl mx-auto app-stack-24">
        <AppPageHeader
          kicker="Account"
          title="Company Settings"
          subtitle="Manage branding, alerts, regional defaults, and integrations for your team."
          actions={
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  subscriptionStatus === "active" ? "default" : "destructive"
                }
                className="text-sm"
              >
                {subscriptionTier.charAt(0).toUpperCase() +
                  subscriptionTier.slice(1)}{" "}
                Plan
              </Badge>
              <span className="text-sm text-muted-foreground">
                {seatUsage} / {seatLimit} seats used
              </span>
            </div>
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="regional">Regional</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic information about your company.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>White-Label Configuration</CardTitle>
                <CardDescription>
                  Customize how your business appears on generated reports and
                  client portals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="border rounded-lg p-2 h-20 w-20 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 border border-dashed border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-600">
                          <Upload className="h-4 w-4" />
                          {uploadingLogo ? "Uploading..." : "Upload New Logo"}
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
                    This color will be used for headers and accents in your PDF
                    reports.
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Preview: PDF Header</Label>
                  <div
                    className="w-full h-16 rounded flex items-center px-6 relative overflow-hidden"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="z-10 flex items-center gap-3">
                      {logoUrl ? (
                        <div className="bg-white/90 p-1 rounded">
                          <img
                            src={logoUrl}
                            alt="Logo"
                            className="h-8 object-contain"
                          />
                        </div>
                      ) : null}
                      <span className="text-white font-bold text-lg drop-shadow-md">
                        {companyName || "Your Company Name"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Alerts & Automations</CardTitle>
                <CardDescription>
                  Configure which notifications are sent via SMS and Email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TestAutomationButton
                  phone={alertPhone}
                  messageTemplate={alertMessage}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col space-y-2 rounded-lg border bg-secondary/40 p-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="review-hunter-toggle"
                        checked={reviewHunterEnabled}
                        onChange={(e) =>
                          setReviewHunterEnabled(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label
                        htmlFor="review-hunter-toggle"
                        className="font-semibold cursor-pointer"
                      >
                        Review Hunter
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Automatically send a review request (SMS/Email) when a Job
                      is marked "Completed".
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2 rounded-lg border bg-secondary/40 p-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="invoice-chaser-toggle"
                        checked={invoiceChaserEnabled}
                        onChange={(e) =>
                          setInvoiceChaserEnabled(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label
                        htmlFor="invoice-chaser-toggle"
                        className="font-semibold cursor-pointer"
                      >
                        Invoice Chaser
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Automatically send a gentle reminder email for unpaid
                      invoices 3 days past due.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="alert-phone">Alert Destination Phone</Label>
                    <Input
                      id="alert-phone"
                      placeholder="+15551234567"
                      value={alertPhone}
                      onChange={(e) => setAlertPhone(e.target.value)}
                      className="bg-background text-foreground border-border"
                    />
                    <p className="text-xs text-gray-500">
                      For System Alerts (Admin).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alert-msg">Review Request Template</Label>
                    <Input
                      id="alert-msg"
                      placeholder="Review us..."
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      className="bg-background text-foreground border-border"
                    />
                    <p className="text-xs text-gray-500">
                      Default message for Review Requests.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-lg font-semibold">
                    Notification Preferences
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email-notifications"
                        checked={emailNotifications}
                        onChange={(e) =>
                          setEmailNotifications(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary"
                      />
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sms-notifications"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary"
                      />
                      <Label htmlFor="sms-notifications">
                        SMS Notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="job-complete-alerts"
                        checked={jobCompleteAlerts}
                        onChange={(e) => setJobCompleteAlerts(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary"
                      />
                      <Label htmlFor="job-complete-alerts">
                        Job Complete Alerts
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="payment-received-alerts"
                        checked={paymentReceivedAlerts}
                        onChange={(e) =>
                          setPaymentReceivedAlerts(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary"
                      />
                      <Label htmlFor="payment-received-alerts">
                        Payment Received Alerts
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regional">
            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>
                  Configure regional formatting preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      placeholder="USD"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Input
                      id="date-format"
                      placeholder="MM/dd/yyyy"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fintech Integration</CardTitle>
                  <CardDescription>
                    Offer financing to your customers directly on your PDF
                    reports.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 my-2">
                    <input
                      type="checkbox"
                      id="financing-toggle"
                      checked={financingEnabled}
                      onChange={(e) => setFinancingEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label
                      htmlFor="financing-toggle"
                      className="font-medium cursor-pointer"
                    >
                      Enable Financing Links on PDFs
                    </Label>
                  </div>

                  {financingEnabled && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="financing-link">
                        Financing Application URL
                      </Label>
                      <Input
                        id="financing-link"
                        placeholder="https://wisetack.us/your-business/..."
                        value={financingLink}
                        onChange={(e) => setFinancingLink(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        This link will be clickable on every Winterization &
                        Maintenance Certificate.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Google Sheets Integration</CardTitle>
                  <CardDescription>
                    Connect Google Sheets for data export.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GoogleSheetConnect />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
