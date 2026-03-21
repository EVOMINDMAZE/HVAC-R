import { Loader2, Sparkles } from "lucide-react";
import { useState, useEffect } from 'react';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';

interface CreateWarrantyClaimDialogProps {
    jobId: string;
    userId: string;
    initialData?: {
        brand?: string;
        model?: string;
        serial?: string;
        symptom?: string;
        diagnosis?: string;
    } | null;
    onClaimCreated?: () => void;
}

export function CreateWarrantyClaimDialog({ jobId, userId, initialData, onClaimCreated }: CreateWarrantyClaimDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Equipment Info
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [serial, setSerial] = useState("");

    // Fault Details
    const [symptom, setSymptom] = useState("");
    const [diagnosis, setDiagnosis] = useState("");

    useEffect(() => {
        if (initialData) {
            if (initialData.brand) setBrand(initialData.brand);
            if (initialData.model) setModel(initialData.model);
            if (initialData.serial) setSerial(initialData.serial);
            if (initialData.symptom) setSymptom(initialData.symptom);
            if (initialData.diagnosis) setDiagnosis(initialData.diagnosis);
            setOpen(true);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('warranty_claims')
                .insert({
                    job_id: jobId,
                    user_id: userId,
                    status: 'draft',
                    equipment_info: {
                        brand,
                        model,
                        serial
                    },
                    fault_details: {
                        symptom,
                        diagnosis
                    }
                });

            if (error) throw error;

            toast({
                title: "Claim Draft Created",
                description: "Warranty claim has been saved as a draft.",
            });

            setOpen(false);
            resetForm();
            if (onClaimCreated) onClaimCreated();

        } catch (error: any) {
            console.error('Error creating claim:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create warranty claim.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setBrand("");
        setModel("");
        setSerial("");
        setSymptom("");
        setDiagnosis("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Warranty Claim</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">New Warranty Claim</DialogTitle>
                    <DialogDescription>
                        Create a new warranty claim draft for this job.
                        {initialData && (
                            <div className="mt-3 flex items-center text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/20 p-2.5 rounded-[0.75rem] text-xs border border-purple-100 dark:border-purple-800/30">
                                <Sparkles className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                AI Auto-filled from job notes
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground border-b border-border/40 pb-2">Equipment Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand" className="text-foreground/80">Brand</Label>
                                <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Carrier" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model" className="text-foreground/80">Model Number</Label>
                                <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model #" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serial" className="text-foreground/80">Serial Number</Label>
                            <Input id="serial" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Serial #" required />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground border-b border-border/40 pb-2">Fault Details</h4>
                        <div className="space-y-2">
                            <Label htmlFor="symptom" className="text-foreground/80">Symptom / Customer Complaint</Label>
                            <Input id="symptom" value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="e.g. Unit not cooling" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="diagnosis" className="text-foreground/80">Technician Diagnosis</Label>
                            <Textarea
                                id="diagnosis"
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                placeholder="Detailed diagnosis of the failure..."
                                className="min-h-[100px]"
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Draft
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
