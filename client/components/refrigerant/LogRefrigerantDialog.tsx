
import React, { useState } from "react";
import { Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/lib/supabase";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

type Cylinder = Database["public"]["Tables"]["refrigerant_cylinders"]["Row"];

interface LogRefrigerantDialogProps {
    cylinder: Cylinder;
    onLogSuccess: () => void;
}

export function LogRefrigerantDialog({ cylinder, onLogSuccess }: LogRefrigerantDialogProps) {
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"charge" | "recover">("charge");
    const [formData, setFormData] = useState({
        amount_lbs: "",
        job_id: "",
        asset_id: "",
        notes: "",
    });
    const [assets, setAssets] = React.useState<{ id: string, name: string }[]>([]);

    React.useEffect(() => {
        if (open) {
            fetchAssets();
        }
    }, [open]);

    const fetchAssets = async () => {
        const { data } = await supabase.from('assets').select('id, name');
        if (data) setAssets(data);
    };

    // Derived state to check if amount exceeds available
    const currentWeight = Number(cylinder.current_weight_lbs);
    const amount = parseFloat(formData.amount_lbs) || 0;
    const isOverdraft = activeTab === "charge" && amount > currentWeight;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.amount_lbs || Number(formData.amount_lbs) <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount greater than 0.",
                variant: "destructive",
            });
            return;
        }

        if (isOverdraft) {
            toast({
                title: "Insufficient Refrigerant",
                description: `You only have ${currentWeight} lbs available.`,
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.from("refrigerant_logs").insert({
                user_id: user.id,
                cylinder_id: cylinder.id,
                asset_id: formData.asset_id || null,
                transaction_type: activeTab,
                amount_lbs: amount,
                job_id: formData.job_id || null,
                notes: formData.notes || null,
                technician_name: user.email, // Simple fallback for now
            });

            if (error) throw error;

            toast({
                title: activeTab === "charge" ? "Charge Logged 📉" : "Recovery Logged 📈",
                description: `${amount} lbs ${activeTab === "charge" ? "used from" : "added to"} ${cylinder.cylinder_code}.`,
            });

            setFormData({
                amount_lbs: "",
                job_id: "",
                asset_id: "",
                notes: "",
            });
            setOpen(false);
            onLogSuccess();
        } catch (error: any) {
            console.error("Error logging refrigerant:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to log usage.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full mt-2">
                    Log Usage
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log {cylinder.refrigerant_type} Usage</DialogTitle>
                    <DialogDescription>
                        Record refrigerant charged or recovered for Cylinder <span className="font-mono font-medium text-foreground">{cylinder.cylinder_code}</span>.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="charge" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-900 dark:data-[state=active]:bg-red-900/50 dark:data-[state=active]:text-red-100">
                            <ArrowDownCircle className="w-4 h-4 mr-2" />
                            Charge (Out)
                        </TabsTrigger>
                        <TabsTrigger value="recover" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900 dark:data-[state=active]:bg-green-900/50 dark:data-[state=active]:text-green-100">
                            <ArrowUpCircle className="w-4 h-4 mr-2" />
                            Recover (In)
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">

                            {/* Dynamic Helper Text */}
                            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 text-sm border">
                                {activeTab === "charge" ? (
                                    <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                                        <span>Removing refrigerant from tank.</span>
                                        <span className="font-bold">Max: {currentWeight} lbs</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                        <span>Adding refrigerant BACK to tank.</span>
                                        <span className="font-bold">Initial: {cylinder.initial_weight_lbs} lbs</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount (lbs)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.amount_lbs}
                                    onChange={(e) => setFormData({ ...formData, amount_lbs: e.target.value })}
                                    className={isOverdraft ? "border-red-500 focus-visible:ring-red-500" : ""}
                                />
                                {isOverdraft && (
                                    <p className="text-xs text-red-500 font-medium animate-pulse">
                                        Amount exceeds current tank weight ({currentWeight} lbs).
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="asset">Asset / Equipment (Recommended)</Label>
                                <Select value={formData.asset_id} onValueChange={(v) => setFormData({ ...formData, asset_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select equipment..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assets.map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="job">Job / Reference (Optional)</Label>
                                <Input
                                    id="job"
                                    placeholder="e.g. Smith Residence / Job #402"
                                    value={formData.job_id}
                                    onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Details about the leak or repair..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={loading || isOverdraft} variant={activeTab === 'charge' ? 'destructive' : 'default'} className={activeTab === 'recover' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {activeTab === "charge" ? "Log Charge" : "Log Recovery"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
