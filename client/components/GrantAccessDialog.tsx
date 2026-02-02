import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Loader2, UserPlus, Link } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GrantAccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
}

export function GrantAccessDialog({ open, onOpenChange, clientId }: GrantAccessDialogProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGrantAccess = async () => {
        if (!email) return;
        setLoading(true);
        try {
            const { error } = await supabase.rpc('grant_client_access', {
                target_email: email,
                target_client_id: clientId
            });

            if (error) throw error;

            toast({
                title: "Access Granted",
                description: `User ${email} has been granted access to this portal.`,
            });
            onOpenChange(false);
            setEmail('');
        } catch (err: any) {
            toast({
                title: "Failed to Grant Access",
                description: err.message || "An error occurred.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async () => {
        if (!email || !name) {
            toast({ title: "Validation Error", description: "Email and Name are required.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email,
                    role: 'client',
                    full_name: name,
                    client_id: clientId
                }
            });

            if (error) throw error;

            toast({
                title: "Invitation Sent",
                description: `Successfully invited ${name} to the client portal.`,
            });
            onOpenChange(false);
            setEmail('');
            setName('');
        } catch (err: any) {
            toast({
                title: "Invitation Failed",
                description: err.message || "Could not send invitation.",
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
                        <Mail className="h-5 w-5 text-primary" />
                        Manage Client Access
                    </DialogTitle>
                    <DialogDescription>
                        Give users access to this client's portal.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="invite" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="invite" className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Invite New
                        </TabsTrigger>
                        <TabsTrigger value="link" className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            Link Existing
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="invite" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="invite-user-name">Full Name</Label>
                                <Input
                                    id="invite-user-name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-user-email">Email Address</Label>
                                <Input
                                    id="invite-user-email"
                                    placeholder="client@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button className="w-full" onClick={handleInviteUser} disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>User Email</Label>
                            <Input
                                placeholder="existing-user@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                They must already have a ThermoNeural account.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button className="w-full" variant="secondary" onClick={handleGrantAccess} disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Grant Access
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
