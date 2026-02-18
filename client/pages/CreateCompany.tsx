import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";

export default function CreateCompany() {
  const navigate = useNavigate();
  const { user, refreshCompanies, switchCompany } = useSupabaseAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });





  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.name.trim()) {
      addToast({
        title: "Company Name Required",
        description: "Please enter a name for your company.",
        type: "error",
      });
      return;
    }



    setIsLoading(true);

    try {
      // 1. Create the company
      const { data: company, error: createError } = await supabase
        .from("companies")
        .insert({
          name: formData.name, // "name" is the column in companies table
          // owner_id/user_id handled by RLS typically, but let's see schema.
          // Based on migrations: companies has user_id NOT NULL.
          user_id: user.id, 
          // seat_limit default is 1
        })
        .select()
        .single();

      if (createError) throw createError;

      // 2. Refresh local state to see the new company
      await refreshCompanies();

      // 3. Switch context to the new company
      if (company) {
        await switchCompany(company.id);
        addToast({
          title: "Success",
          description: "Company created successfully!",
          type: "success",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error creating company:", error);
      addToast({
        title: "Error",
        description: error.message || "Failed to create company",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create New Organization
          </CardTitle>
          <CardDescription>
            Set up a new workspace for your team.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-4">


            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                placeholder="Acme HVAC Services"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
            {/* Optional fields */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/select-company")}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Company
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}