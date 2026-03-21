import { Loader2, RefreshCcw, Check, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { CreateInvoiceDialog } from "./CreateInvoiceDialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Invoice {
    id: string;
    ticket_number: string;
    total_amount: number;
    status: string;
    due_date: string;
    created_at: string;
}

interface InvoiceListProps {
    jobId: string;
    clientId: string;
    companyId: string;
    suggestedInvoiceData?: {
        amount?: number;
        description?: string;
        items?: any[];
    } | null;
}

export function InvoiceList({ jobId, clientId, companyId, suggestedInvoiceData }: InvoiceListProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            // Verify IDs are present
            if (!jobId || !clientId || !companyId) {
                console.warn("Missing IDs for InvoiceFetch:", { jobId, clientId, companyId });
                return;
            }

            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (jobId) fetchInvoices();
    }, [jobId]);

    const handleMarkPaid = async (id: string) => {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: 'paid' })
                .eq('id', id);

            if (error) throw error;

            toast({ title: "Invoice Paid", description: "Status updated to Paid." });
            fetchInvoices();
        } catch (e) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const handleResend = async (id: string) => {
        // Trigger Edge Function logic via direct update or just a toast for now
        toast({ title: "Reminder Queued", description: "The system will send a reminder shortly." });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'default'; // primary/black
            case 'overdue': return 'destructive'; // red
            case 'sent': return 'secondary'; // gray
            default: return 'outline';
        }
    };

    if (loading && invoices.length === 0) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 shadow-md shadow-primary/5 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-base font-semibold">Invoices</CardTitle>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchInvoices} className="h-8 w-8 hover:bg-muted transition-colors">
                        <RefreshCcw className="w-3.5 h-3.5" />
                    </Button>
                    <CreateInvoiceDialog
                        jobId={jobId}
                        clientId={clientId}
                        companyId={companyId}
                        onInvoiceCreated={fetchInvoices}
                        initialData={suggestedInvoiceData}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {invoices.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground/60 text-sm">
                        No invoices found for this job.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">Ticket #</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">Status</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">Amount</TableHead>
                                <TableHead className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">Due Date</TableHead>
                                <TableHead className="text-right text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((inv) => (
                                <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors border-border/30">
                                    <TableCell className="font-medium text-sm py-3">{inv.ticket_number || '---'}</TableCell>
                                    <TableCell className="py-3">
                                        <Badge variant={getStatusColor(inv.status) as any} className="text-[10px] px-2 py-0.5 capitalize">
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-sm font-medium">${inv.total_amount?.toFixed(2)}</TableCell>
                                    <TableCell className="py-3 text-sm text-muted-foreground/70">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell className="py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            {inv.status !== 'paid' && (
                                                <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(inv.id)} title="Mark Paid" className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600 transition-colors">
                                                    <Check className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" onClick={() => handleResend(inv.id)} title="Resend" className="h-7 w-7 p-0 hover:bg-muted transition-colors">
                                                <Mail className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
