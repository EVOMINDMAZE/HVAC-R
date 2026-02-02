import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { Loader2, RefreshCcw, Check, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchInvoices}>
                        <RefreshCcw className="w-4 h-4" />
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
            <CardContent>
                {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No invoices found for this job.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ticket #</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium">{inv.ticket_number || '---'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(inv.status) as any}>
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>${inv.total_amount?.toFixed(2)}</TableCell>
                                    <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        {inv.status !== 'paid' && (
                                            <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(inv.id)} title="Mark Paid">
                                                <Check className="w-4 h-4 text-green-600" />
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost" onClick={() => handleResend(inv.id)} title="Resend">
                                            <Mail className="w-4 h-4" />
                                        </Button>
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
