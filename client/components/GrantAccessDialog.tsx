import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

interface GrantAccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
}

export function GrantAccessDialog({ open, onOpenChange, clientId }: GrantAccessDialogProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGrantAccess = async () => {
        if (!email) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('grant_client_access', {
                target_email: email,
                target_client_id: clientId
            });

            if (error) throw error;

            toast({
                title: "Access Granted",
                description: `User ${email} has been granted access to this portal.`,
                variant: "default"
            });
            onOpenChange(false);
            setEmail('');
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Failed to Grant Access",
                description: err.message || "An error occurred.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-600" />
                        Invite Client User
                    </DialogTitle>
                    <DialogDescription>
                        Grant access to an existing user by email. They must have already signed up.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">User Email</Label>
                        <Input
                            id="email"
                            placeholder="client@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <p className="text-xs text-slate-500">
                            Note: The user must already have an account. If not, ask them to Sign Up first.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleGrantAccess} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Grant Access
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
