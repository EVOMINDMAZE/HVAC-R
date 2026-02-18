import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Thermometer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface AutomationRuleFormProps {
    assets: any[];
    onSuccess: () => void;
    companyId: string;
}

export function AutomationRuleForm({ assets, onSuccess, companyId }: AutomationRuleFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [rule, setRule] = useState({
        asset_id: '',
        trigger_type: 'temperature_high',
        threshold_value: '40',
        action_type: 'sms',
        action_recipient: '+15142358226' // Default for Testing
    });

    async function handleCreateRule() {
        if (!rule.asset_id) {
            toast({ title: "Validation Error", description: "Please select an asset.", variant: "destructive" });
            return;
        }
        if (!rule.threshold_value) {
            toast({ title: "Validation Error", description: "Please enter a threshold value.", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.from('automation_rules').insert({
                asset_id: rule.asset_id,
                company_id: companyId,
                trigger_type: rule.trigger_type,
                threshold_value: parseFloat(rule.threshold_value),
                action_type: rule.action_type,
                action_config: rule.action_recipient ? { recipient: rule.action_recipient } : {}
            });

            if (error) throw error;
            toast({ title: "Automation Rule Active", description: "System will now monitor this condition." });
            onSuccess();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-4 py-4">
            {/* Asset Selection */}
            <div className="space-y-2">
                <Label>Target Asset</Label>
                <Select value={rule.asset_id} onValueChange={v => setRule({ ...rule, asset_id: v })}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent>
                        {assets.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">No assets found.</div>
                        ) : (
                            assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>)
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Trigger Condition */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={rule.trigger_type} onValueChange={v => setRule({ ...rule, trigger_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="temperature_high">Temp High (&gt;)</SelectItem>
                            <SelectItem value="temperature_low">Temp Low (&lt;)</SelectItem>
                            {/* Future: <SelectItem value="offline">Device Offline</SelectItem> */}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Threshold (°F)</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            value={rule.threshold_value}
                            onChange={e => setRule({ ...rule, threshold_value: e.target.value })}
                            className="pl-9"
                        />
                        <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Action */}
            <div className="space-y-2">
                <Label>Action</Label>
                <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                    <Select value={rule.action_type} onValueChange={v => setRule({ ...rule, action_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sms">Send SMS</SelectItem>
                            <SelectItem value="email">Send Email</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder={rule.action_type === 'sms' ? "Mobile Number" : "Email Address"}
                        value={rule.action_recipient}
                        onChange={e => setRule({ ...rule, action_recipient: e.target.value })}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {rule.action_type === 'sms'
                        ? "We'll text you immediately when triggered."
                        : "Detailed report sent to inbox."}
                </p>
            </div>

            <DialogFooter className="mt-4">
                <Button onClick={handleCreateRule} disabled={loading}>
                    {loading ? "Saving..." : "Save Rule"}
                </Button>
            </DialogFooter>
        </div>
    );
}
