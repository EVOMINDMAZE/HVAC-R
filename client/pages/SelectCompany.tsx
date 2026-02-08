import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import {
  Building2,
  Crown,
  Shield,
  Users,
  Wrench,
  ArrowRight,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SelectCompany() {
  const { companies, activeCompany, switchCompany, isLoading, isRefreshing, user, refreshCompanies } =
    useSupabaseAuth();
  const navigate = useNavigate();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [creationError, setCreationError] = useState<Error | null>(null);
  const hasAttemptedAutoCreate = useRef(false);
  const { addToast } = useToast();

  useEffect(() => {
    // If only one company, auto-select and redirect
    if (!isLoading && !isRefreshing && companies.length === 1) {
      handleSelectCompany(companies[0].company_id);
    }
  }, [companies, isLoading, isRefreshing, navigate]);

  useEffect(() => {
    // Auto-create company if user has no companies
    // CRITICAL: Set guard flag immediately at the top to prevent race conditions
    if (hasAttemptedAutoCreate.current) {
      return;
    }
    
    // Early return if conditions aren't met
    if (isLoading || isRefreshing || companies.length > 0 || !user || isCreatingCompany || creationError) {
      return;
    }
    
    // Set the flag IMMEDIATELY before any async operations
    hasAttemptedAutoCreate.current = true;
    
    const autoCreateCompany = async () => {
      setIsCreatingCompany(true);
      setCreationError(null);
      
      try {
          // First, double-check the database directly to avoid race conditions
          const { data: existingCompanies, error: checkError } = await supabase
            .from("companies")
            .select("id, name")
            .eq("user_id", user.id)
            .limit(1);
          
          if (checkError) {
            console.warn("Error checking existing companies:", checkError);
          }
          
          if (existingCompanies && existingCompanies.length > 0) {
            // Company already exists, refresh the list instead of creating
            console.log("Company already exists for user, refreshing list");
            await refreshCompanies();
            return;
          }
          
          // Generate company name based on user email
          const companyName = `${user.email?.split('@')[0] || 'My'}'s Workspace`;
          
          const { data: company, error } = await supabase
            .from("companies")
            .insert({
              name: companyName,
              user_id: user.id,
            })
            .select()
            .single();
            
          if (error) {
            // Handle duplicate key violation specifically
            if (error.code === '23505' && error.message.includes('companies_user_id_key')) {
              console.log("Duplicate company detected, fetching existing companies");
              await refreshCompanies();
              return;
            }
            throw error;
          }
          
          // Add user to user_roles as admin for the new company
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: user.id,
              company_id: company.id,
              role: "admin"
            });
          
          if (roleError) {
            console.warn("Failed to add user to user_roles:", roleError);
            // Continue anyway - the user is still the owner via companies.user_id
          }
          
          // Refresh companies list and switch to new company
          // The switchCompany function will handle redirection
          await switchCompany(company.id);
          
          addToast({
            title: "Workspace Created",
            description: `Your free workspace "${companyName}" has been created with 3 seats.`,
            type: "success",
          });
        } catch (error: any) {
          console.error("Failed to auto-create company:", error);
          setCreationError(error);
          addToast({
            title: "Workspace Creation Failed",
            description: error.message || "Please try creating a workspace manually.",
            type: "error",
          });
        } finally {
          setIsCreatingCompany(false);
        }
      };
    
    autoCreateCompany();
  }, [companies, isLoading, isRefreshing, user, isCreatingCompany, creationError, switchCompany, addToast, refreshCompanies]);

  const handleSelectCompany = async (companyId: string) => {
    setSwitchingId(companyId);
    try {
      const { success, error } = await switchCompany(companyId);
      if (success) {
        // Role-based redirection
        const company = companies.find(c => c.company_id === companyId);
        if (company) {
          if (company.role === "tech" || company.role === "technician") {
            navigate("/tech");
          } else if (company.role === "client") {
            navigate("/portal");
          } else {
            navigate("/dashboard");
          }
        } else {
          // Fallback
          navigate("/dashboard");
        }
      } else {
        console.error("Failed to switch company:", error);
      }
    } catch (err) {
      console.error("Exception switching company:", err);
    } finally {
      setSwitchingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Building2 className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold">Loading your companies...</h2>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string, isOwner: boolean) => {
    if (isOwner) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </Badge>
      );
    }

    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case "manager":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Users className="w-3 h-3 mr-1" />
            Manager
          </Badge>
        );
      case "tech":
      case "technician":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <Wrench className="w-3 h-3 mr-1" />
            Technician
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Users className="w-3 h-3 mr-1" />
            {role}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-xl text-muted-foreground">
            {isCreatingCompany ? "Setting up your workspace..." : creationError ? "Workspace creation failed" : companies.length > 0 ? "Select a workspace to continue" : "How would you like to get started?"}
          </p>
        </div>

        {isCreatingCompany ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg">Creating your free workspace...</p>
          </div>
        ) : creationError ? (
          <div className="max-w-md mx-auto">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Workspace Creation Failed</CardTitle>
                <CardDescription>
                  We couldn't automatically create a workspace for you. Please try creating one manually.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/create-company")} className="w-full">
                  Create Workspace Manually
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : companies.length === 0 ? (
          // This should not happen, but as fallback show loading
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg">Loading...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Card
                  key={company.company_id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
                    activeCompany?.company_id === company.company_id &&
                      "ring-2 ring-primary",
                  )}
                  onClick={() => handleSelectCompany(company.company_id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    {activeCompany?.company_id === company.company_id && (
                      <Badge variant="default" className="bg-green-600">
                        Current
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    <CardTitle className="text-lg mb-2">{company.company_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(company.role, company.is_owner)}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="ghost"
                      className="w-full justify-between mt-2"
                      disabled={switchingId === company.company_id}
                    >
                      {switchingId === company.company_id ? "Switching..." : "Select Workspace"}
                      {!switchingId && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {/* Add "Create New" card to the grid if companies exist */}
              <Card 
                className="cursor-pointer border-dashed hover:border-primary hover:bg-muted/50 transition-colors flex flex-col justify-center items-center p-6 min-h-[200px]"
                onClick={() => navigate("/create-company")}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Add New Workspace</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Create another organization
                </p>
              </Card>
            </div>

            <div className="flex justify-center pt-8 border-t">
              <Button variant="link" onClick={() => navigate("/join-company")} className="text-muted-foreground">
                Have another invite code? Join a team
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
