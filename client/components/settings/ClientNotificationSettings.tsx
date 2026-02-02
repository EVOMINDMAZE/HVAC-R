import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Bell, Mail, MessageSquare, Loader2 } from "lucide-react";

interface NotificationPreferences {
    sms_enabled: boolean;
    email_enabled: boolean;
}

interface ClientNotificationSettingsProps {
    clientId?: string; // Optional: If not provided, will attempt to fetch from logged-in user's client record
}

export function ClientNotificationSettings({ clientId }: ClientNotificationSettingsProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState<NotificationPreferences>({
        sms_enabled: true,
        email_enabled: true
    });
    const [currentClientId, setCurrentClientId] = useState<string | null>(clientId || null);

    useEffect(() => {
        fetchPreferences();
    }, [clientId]);

    async function fetchPreferences() {
        try {
            setLoading(true);

            // If no clientId provided, fetch the current user's client record
            if (!currentClientId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    throw new Error("Not authenticated");
                }

                // Fetch client record by user's email (assuming client portal login uses contact_email)
                const { data: clientData, error: clientError } = await supabase
                    .from('clients')
                    .select('id, notification_preferences')
                    .eq('contact_email', user.email)
                    .single();

                if (clientError) throw clientError;
                if (clientData) {
                    setCurrentClientId(clientData.id);
                    if (clientData.notification_preferences) {
                        setPrefs(clientData.notification_preferences);
                    }
                }
            } else {
                // Fetch preferences for provided clientId
                const { data, error } = await supabase
                    .from('clients')
                    .select('notification_preferences')
                    .eq('id', currentClientId)
                    .single();

                if (error) throw error;
                if (data?.notification_preferences) {
                    setPrefs(data.notification_preferences);
                }
            }
        } catch (error: any) {
            console.error("Error fetching notification preferences:", error);
            toast({
                title: "Error loading preferences",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function savePreferences() {
        if (!currentClientId) {
            toast({
                title: "Error",
                description: "Client ID not found",
                variant: "destructive",
            });
            return;
        }

        try {
            setSaving(true);

            const { error } = await supabase
                .from('clients')
                .update({
                    notification_preferences: prefs,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentClientId);

            if (error) throw error;

            toast({
                title: "Preferences saved",
                description: "Your notification preferences have been updated.",
            });
        } catch (error: any) {
            console.error("Error saving preferences:", error);
            toast({
                title: "Failed to save",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>
                    Choose how you'd like to receive updates about your service appointments
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Email Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm">
                            <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
                                Email Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive updates via email
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="email-notifications"
                        checked={prefs.email_enabled}
                        onCheckedChange={(val) => setPrefs({ ...prefs, email_enabled: val })}
                    />
                </div>

                {/* SMS Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <Label htmlFor="sms-notifications" className="text-base font-medium cursor-pointer">
                                SMS Text Messages
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive updates via text message
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="sms-notifications"
                        checked={prefs.sms_enabled}
                        onCheckedChange={(val) => setPrefs({ ...prefs, sms_enabled: val })}
                    />
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                        ℹ️  What you'll receive:
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                        <li>• Appointment confirmations</li>
                        <li>• Service completion notices</li>
                        <li>• Review requests</li>
                        <li>• Important service updates</li>
                    </ul>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                    <Button
                        onClick={savePreferences}
                        disabled={saving}
                        className="min-w-[140px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Preferences"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
