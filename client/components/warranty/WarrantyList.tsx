import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CreateWarrantyClaimDialog } from "./CreateWarrantyClaimDialog";

interface WarrantyListProps {
    jobId: string;
    userId: string;
    suggestedClaimData?: any;
}

export function WarrantyList({ jobId, userId, suggestedClaimData }: WarrantyListProps) {
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('warranty_claims')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClaims(data || []);
        } catch (error) {
            console.error('Error fetching warranty claims:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, [jobId]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Warranty Claims</h3>
                <CreateWarrantyClaimDialog
                    jobId={jobId}
                    userId={userId}
                    onClaimCreated={fetchClaims}
                    initialData={suggestedClaimData}
                />
            </div>

            {claims.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <div className="bg-muted/50 p-4 rounded-full mb-4">
                            <FileText className="w-8 h-8 opacity-50" />
                        </div>
                        <p>No warranty claims found for this job.</p>
                        <p className="text-sm mt-1">Create a claim to track component failures and replacements.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {claims.map((claim) => (
                        <Card key={claim.id}>
                            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-medium">
                                            {claim.equipment_info?.brand} {claim.equipment_info?.model}
                                        </CardTitle>
                                        <Badge variant={claim.status === 'draft' ? 'secondary' : 'default'}>
                                            {claim.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Serial: {claim.equipment_info?.serial}
                                    </p>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(claim.created_at).toLocaleDateString()}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <div className="bg-muted/30 p-3 rounded-md text-sm mb-3">
                                    <span className="font-semibold block mb-1">Diagnosis:</span>
                                    {claim.fault_details?.diagnosis}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm">View Details</Button>
                                    {claim.status === 'draft' && (
                                        <Button variant="outline" size="sm">Edit Draft</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
