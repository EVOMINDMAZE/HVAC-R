import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";  // Ensure this component exists, or use standard textarea if not
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Sparkles } from "lucide-react";

interface CreateInvoiceDialogProps {
    jobId: string;
    clientId: string;
    companyId: string;
    onInvoiceCreated: () => void;
    initialData?: {
        amount?: number;
        description?: string;
        items?: any[];
    } | null;
}

export function CreateInvoiceDialog({ jobId, clientId, companyId, onInvoiceCreated, initialData }: CreateInvoiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Form State
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [description, setDescription] = useState("");

    // Auto-populate when initialData is provided
    useEffect(() => {
        if (initialData) {
            if (initialData.amount) setAmount(initialData.amount.toString());
            if (initialData.description) setDescription(initialData.description);
            // We'll store items directly in the insert logic if validation passes, 
            // but for now we just hold them in the "description" visual or a hidden state if needed.
            // For MVP, we assume description contains the summary.
            setOpen(true); // Auto-open dialog if data is passed
        }
    }, [initialData]);

    const handleCreate = async () => {
        if (!amount || !dueDate) {
            toast({
                title: "Missing Fields",
                description: "Please enter an amount and due date.",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('invoices')
                .insert({
                    company_id: companyId,
                    client_id: clientId,
                    job_id: jobId,
                    status: 'sent', // Default to sent to trigger automation
                    total_amount: parseFloat(amount),
                    due_date: new Date(dueDate).toISOString(),
                    description: description,
                    items: initialData?.items || [] // Store raw JSON items if available
                });

            if (error) throw error;

            toast({
                title: "Invoice Created",
                description: "The invoice has been created and marked as sent.",
            });
            setOpen(false);
            setAmount("");
            setDueDate("");
            setDescription("");
            onInvoiceCreated();

        } catch (error: any) {
            console.error("Error creating invoice:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create invoice.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {initialData ? <Sparkles className="w-5 h-5 text-purple-600" /> : null}
                        Create New Invoice
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {initialData && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md text-sm text-purple-800 dark:text-purple-300 mb-2">
                            AI suggested values applied. Please review.
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Total Amount ($)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="due-date">Due Date</Label>
                        <Input
                            id="due-date"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description / Notes</Label>
                        <Textarea
                            id="description"
                            placeholder="Invoice details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create & Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
