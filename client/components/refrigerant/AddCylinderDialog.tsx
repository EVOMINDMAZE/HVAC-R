
import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface AddCylinderDialogProps {
    onCylinderAdded: () => void;
}

const COMMON_REFRIGERANTS = [
    "R-410A",
    "R-22",
    "R-32",
    "R-454B",
    "R-404A",
    "R-134a",
    "R-290",
    "R-407C",
    "R-448A",
    "R-449A",
    "Other"
];

export function AddCylinderDialog({ onCylinderAdded }: AddCylinderDialogProps) {
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cylinder_code: "",
        refrigerant_type: "",
        initial_weight_lbs: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.cylinder_code || !formData.refrigerant_type || !formData.initial_weight_lbs) {
            toast({
                title: "Missing Fields",
                description: "Please fill out all fields.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            const weight = parseFloat(formData.initial_weight_lbs);

            const { error } = await supabase.from("refrigerant_cylinders").insert({
                user_id: user.id,
                cylinder_code: formData.cylinder_code,
                refrigerant_type: formData.refrigerant_type,
                initial_weight_lbs: weight,
                current_weight_lbs: weight, // Starts full (or at current weight if logging a partial)
                status: "active",
            });

            if (error) throw error;

            toast({
                title: "Success",
                description: "Cylinder added to inventory.",
            });

            setFormData({
                cylinder_code: "",
                refrigerant_type: "",
                initial_weight_lbs: "",
            });
            setOpen(false);
            onCylinderAdded();
        } catch (error: any) {
            console.error("Error adding cylinder:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to add cylinder.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Cylinder
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Refrigerant Cylinder</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new cylinder to track in your inventory.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">
                            Tag/Code
                        </Label>
                        <Input
                            id="code"
                            placeholder="e.g. T-101"
                            className="col-span-3"
                            value={formData.cylinder_code}
                            onChange={(e) =>
                                setFormData({ ...formData, cylinder_code: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <div className="col-span-3">
                            <Select
                                value={formData.refrigerant_type}
                                onValueChange={(val) => setFormData({ ...formData, refrigerant_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Refrigerant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMMON_REFRIGERANTS.map((ref) => (
                                        <SelectItem key={ref} value={ref}>
                                            {ref}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="weight" className="text-right">
                            Weight (lbs)
                        </Label>
                        <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 24.5"
                            className="col-span-3"
                            value={formData.initial_weight_lbs}
                            onChange={(e) =>
                                setFormData({ ...formData, initial_weight_lbs: e.target.value })
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Cylinder
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
