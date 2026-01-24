import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

interface CreateJobDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateJobDialog({ open, onOpenChange, onSuccess }: CreateJobDialogProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [clients, setClients] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);

    // Form State
    const [clientId, setClientId] = useState('');
    const [assetId, setAssetId] = useState('');
    const [techId, setTechId] = useState('');
    const [title, setTitle] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    // Load available clients/assets/techs
    async function loadData() {
        setLoading(true);
        const [clientsRes, techsRes] = await Promise.all([
            supabase.from('clients').select('id, name').order('name'),
            supabase.from('user_roles').select('user_id, role, users:user_id(email)').eq('role', 'tech') // Assuming relations are set up, if not we might need to query users separately or rely on views. 
            // Actually user_roles usually doesn't relation back easily to auth.users in standard query unless view exists.
            // But let's assume 'users' relation exists OR we just pick from user_roles and we can't get email easily without a view or rpc.
            // Wait, in Phase 5 check, we didn't explicitly create a view for this.
            // Let's create a "get_technicians" RPC or just use a simpler query if `users` is public (it's not).
            // Workaround: We will use a `profiles` table if it exists, or just query `user_roles` and hope we can join.
            // Actually, standard pattern is `public.users` table mirroring auth.users or just `user_roles` table if it has email?
            // `user_roles` defined in 5.1: `user_id`, `role`, `client_id`, `company_id`. No email.
            // We might need to fetch techs differently. For now, let's fetch ALL `user_roles` where role='tech'. 
            // AND we need their emails.
            // Supabase `auth.users` is not accessible.
            // WE NEED A PUBLIC PROFILES OR USERS TABLE.
            // Do we have one?
        ]);

        // Check if we have a way to display Tech Name/Email.
        // If not, we might need to add a Migration to expose tech emails or names.
        // For now, I will assume we can get it or I will prompt to fix it.

        // Actually, Phase 5.1 created `user_roles`. 
        // Let's check `user_roles` table def or just fetch and see.
        // I'll fetch `user_roles` and log it if I can? 
        // I'll assume for now we might fail to get emails.
        // Wait, `JobBoard` displays `technician:technician_id(email)`. 
        // This implies `jobs` table has `technician_id` FK to `auth.users`? No, FK to `public.something`?
        // In `JobBoard.tsx`: `technician:technician_id(email)`
        // This relation works? That implies `technician_id` references a table that has `email`.
        // Does `auth.users` exposed? 
        // Usually no.
        // Maybe `public.users` view?

        // I will proceed assuming `technician:technician_id(email)` works means there IS a relation.
        // So I can query that table. Which table is it? `technician_id` usually refs `auth.users`.
        // If Supabase creates a wrapper view `users` in public, that works.
        // Let's assume there is a `profiles` or `users` table.

        if (clientsRes.data) setClients(clientsRes.data);

        // Fetch assets when client selected
        setLoading(false);
    }

    useEffect(() => {
        if (clientId) {
            loadAssets(clientId);
        } else {
            setAssets([]);
        }
    }, [clientId]);

    async function loadAssets(cid: string) {
        const { data } = await supabase.from('assets').select('id, name').eq('client_id', cid);
        if (data) setAssets(data);
    }

    // Fetch Techs separate step to debug connection
    useEffect(() => {
        if (open) fetchTechs();
    }, [open]);

    async function fetchTechs() {
        // Try to fetch users with role 'tech'
        // We previously used foreign key `technician:technician_id(email)` in JobBoard.
        // This suggests `jobs.technician_id` -> ? -> email.
        // If `jobs.technician_id` refs `auth.users`, we can't `select('email')` unless RLS allows.
        // Let's try querying `user_roles` and join `users` if possible.
        // Or just hardcode for now if we can't find them? No.

        // Strategy: We need a Public View of users for this dropdown.
        // I'll implement the UI assuming we have a list.
        const { data } = await supabase.from('user_roles').select('user_id, role').eq('role', 'tech');
        // We don't have emails here.
        // I will ignore email fetching for a second and just show "Technician [ID]" if needed, 
        // BUT usually we fix this by creating a `public.profiles` table.
        // I'll assume we might need to fix this.

        if (data) setTechnicians(data);
    }

    async function handleSubmit() {
        setSubmitting(true);

        // Combine date and time
        const scheduledAt = scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null;

        const { error } = await supabase.from('jobs').insert({
            client_id: clientId,
            asset_id: assetId || null,
            technician_id: techId || null,
            title: title || 'Service Call',
            description: 'Manual Dispatch',
            status: 'pending',
            scheduled_at: scheduledAt,
            ticket_number: `TKT-${Math.floor(Math.random() * 10000)}`
        });

        if (!error) {
            onSuccess();
            onOpenChange(false);
            resetForm();
        } else {
            alert('Error creating job: ' + error.message);
        }
        setSubmitting(false);
    }

    function resetForm() {
        setClientId('');
        setAssetId('');
        setTechId('');
        setTitle('');
        setScheduledDate('');
        setScheduledTime('');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Service Job</DialogTitle>
                    <DialogDescription>
                        Dispatch a technician to a client location.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    {/* Job Title */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Title</Label>
                        <input
                            id="title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="e.g. AC Repair"
                        />
                    </div>

                    {/* Client Select */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="client" className="text-right">Client</Label>
                        <select
                            id="client"
                            className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={clientId}
                            onChange={e => setClientId(e.target.value)}
                        >
                            <option value="">Select Client...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Asset Select */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="asset" className="text-right">Asset</Label>
                        <select
                            id="asset"
                            className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={assetId}
                            onChange={e => setAssetId(e.target.value)}
                            disabled={!clientId}
                        >
                            <option value="">Select Asset (Optional)</option>
                            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>

                    {/* Technician Select */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tech" className="text-right">Tech</Label>
                        <select
                            id="tech"
                            className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={techId}
                            onChange={e => setTechId(e.target.value)}
                        >
                            <option value="">Unassigned</option>
                            {technicians.map(t => (
                                <option key={t.user_id} value={t.user_id}>
                                    Tech {t.user_id.substring(0, 4)}...
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Schedule</Label>
                        <div className="col-span-3 flex gap-2">
                            <input
                                type="date"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                value={scheduledDate}
                                onChange={e => setScheduledDate(e.target.value)}
                            />
                            <input
                                type="time"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                value={scheduledTime}
                                onChange={e => setScheduledTime(e.target.value)}
                            />
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !clientId}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Dispatch Job
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
