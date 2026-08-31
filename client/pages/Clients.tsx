import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  Users,
  Clock,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  BarChart3,
  FileSpreadsheet,
  Download,
  LayoutGrid,
  Rows3,
  ChevronDown,
  Eye,
} from "lucide-react";
import Papa from "papaparse";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { AppFeedbackState } from "@/components/app/AppFeedbackState";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { AppSectionCard } from "@/components/app/AppSectionCard";
import { AppStatCard } from "@/components/app/AppStatCard";
import { PageContainer } from "@/components/PageContainer";
import { SpreadsheetImporter } from "@/components/shared/SpreadsheetImporter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";



interface Client {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  company_id: string;
  created_at: string;
}

export function Clients() {
  const { user } = useSupabaseAuth();
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("compact");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchClients();
  }, [user]);

  async function fetchClients() {
    if (!user) return;

    try {
      setIsLoading(true);
      setLoadError(null);

      console.log("Fetching clients for user:", user.id);
      console.log("Supabase client:", supabase);
      
      // Get the company ID for the current user
      console.log("Querying companies table for user_id:", user.id);
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id);

      console.log("Company query result:", { companyData, companyError });
      if (companyError) throw companyError;

      // companyData is now an array (could be empty)
      const firstCompany = Array.isArray(companyData) && companyData.length > 0 ? companyData[0] : null;
      
      if (firstCompany) {
        console.log("Found company ID:", firstCompany.id);
        console.log("Querying clients for company_id:", firstCompany.id);
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("company_id", firstCompany.id)
          .order("created_at", { ascending: false });

        console.log("Clients query result:", { data, error });
        if (error) throw error;
        setClients(data || []);
      } else {
        console.log("No company found for user");
        setClients([]);
      }
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      console.error("Error details:", err.message, err.stack);
      setLoadError(err?.message || "Could not load clients.");
      addToast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImport(importedData: any[]) {
    try {
      // Ensure company_id is attached if missing (though the backend checks user)
      // But validation-import expects 'records' which are inserted directly.
      // We should ideally attach company_id here if we can.

      // Get current user's company
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: companyData } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const companyId = companyData?.id;

      const recordsWithCompany = importedData.map((record) => ({
        ...record,
        company_id: companyId, // Add company_id to every record
      }));

      const { data: result, error } = await supabase.functions.invoke(
        "validate-import",
        {
          body: { targetTable: "clients", records: recordsWithCompany },
        },
      );

      if (error) throw error;

      addToast({
        title: "Import Successful",
        description: `Successfully imported ${importedData.length} records.`,
        type: "success",
      });
      fetchClients();
    } catch (err: any) {
      console.error("Import error:", err);
      addToast({
        title: "Import Failed",
        description: err.message || "Failed to import clients.",
        type: "error",
      });
    }
  }

  function handleExport() {
    if (!clients || clients.length === 0) {
      addToast({
        title: "No Data",
        description: "There are no clients to export.",
        type: "info",
      });
      return;
    }

    const csv = Papa.unparse(clients);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `clients_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: "Export Started",
      description: "Your client list is downloading.",
      type: "success",
    });
  }

  async function handleCreateClient() {
    if (!newClient.name || !newClient.email) {
      addToast({
        title: "Missing Information",
        description: "Client name and email are required.",
        type: "error",
      });
      return;
    }

    if (!user) {
      addToast({
        title: "Authentication Error",
        description: "You must be logged in to add clients.",
        type: "error",
      });
      return;
    }

    setIsCreating(true);

    try {
      // 1. Get Company
      console.log("Checking for existing company for user:", user.id);

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (companyError && companyError.code !== "PGRST116") {
        console.error("Error fetching company:", companyError);
        throw companyError;
      }

      let companyId = companyData?.id;

      if (!companyId) {
        console.log(
          "No company found. Attempting to create default company...",
        );
        const newCompanyPayload = {
          user_id: user.id,
          name: `${user.email?.split("@")[0] || "My HVAC"}'s Company`,
          // Removed email/phone as they don't exist in companies table
        };
        console.log("New Company Payload:", newCompanyPayload);

        const { data: newCompany, error: createCompanyError } = await supabase
          .from("companies")
          .insert([newCompanyPayload])
          .select("id")
          .single();

        if (createCompanyError) {
          console.error("Error creating company:", createCompanyError);
          throw new Error(
            `Company Creation Failed: ${createCompanyError.message}`,
          );
        }
        companyId = newCompany.id;
        console.log("Company created successfully:", companyId);
      }

      // 2. Insert Client - Map frontend fields to database columns
      console.log("Creating client linked to company:", companyId);
      const clientPayload = {
        name: newClient.name,
        contact_email: newClient.email,
        contact_phone: newClient.phone,
        address: newClient.address,
        company_id: companyId,
      };
      console.log("Client Payload:", clientPayload);

      const { data: createdClient, error: insertError } = await supabase
        .from("clients")
        .insert([clientPayload])
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting client:", insertError);
        throw new Error(`Client Insertion Failed: ${insertError.message}`);
      }

      if (createdClient) {
        console.log("Client created successfully:", createdClient);
        setClients([createdClient, ...clients]);
        setIsDialogOpen(false);
        setNewClient({ name: "", email: "", phone: "", address: "" });
        addToast({
          title: "Client Added",
          description: `${newClient.name} has been successfully registered.`,
          type: "success",
        });
      }
    } catch (err: any) {
      console.error("Critical Error in handleCreateClient:", err);
      addToast({
        title: "Operation Failed",
        description: err.message || JSON.stringify(err),
        type: "error",
      });
    } finally {
      setIsCreating(false);
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.contact_email &&
        client.contact_email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="app-bg min-h-screen transition-colors duration-300">
      <PageContainer variant="standard" className="app-stack-24">
        <AppPageHeader
          kicker="Work"
          title="Clients"
          subtitle="Organize your customer records, communication details, and service history in one place."
          actions={
            <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => setIsImportOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import List</span>
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl">
                  <UserPlus className="h-4 w-4" />
                  <span>Add New Client</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    New Client Registration
                  </DialogTitle>
                  <DialogDescription>
                    Enter the client details to create a new profile.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-semibold text-foreground"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. John Smith"
                      className="rounded-xl border-border"
                      value={newClient.name}
                      onChange={(e) =>
                        setNewClient({ ...newClient, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-foreground"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="rounded-xl border-border"
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient({ ...newClient, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-semibold text-foreground"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(555) 000-0000"
                      className="rounded-xl border-border"
                      value={newClient.phone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="address"
                      className="text-sm font-semibold text-foreground"
                    >
                      Service Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="Street, City, Zip"
                      className="rounded-xl border-border"
                      value={newClient.address}
                      onChange={(e) =>
                        setNewClient({ ...newClient, address: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateClient}
                    disabled={isCreating}
                    className="rounded-xl px-8"
                  >
                    {isCreating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      "Register Client"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          }
        />

        {/* Stats Summary */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Clients",
              value: clients.length,
              icon: Users,
              tone: "default",
            },
            {
              label: "Added This Month",
              value: clients.filter(
                (c) =>
                  new Date(c.created_at).getMonth() === new Date().getMonth() &&
                  new Date(c.created_at).getFullYear() === new Date().getFullYear(),
              ).length,
              icon: BarChart3,
              tone: "default",
            },
            {
              label: "With Phone on File",
              value: clients.filter((c) => c.contact_phone).length,
              icon: Clock,
              tone: "warning",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : i * 0.08, duration: prefersReducedMotion ? 0 : 0.16 }}
            >
              <AppStatCard
                label={stat.label}
                value={stat.value}
                tone={stat.tone as "default" | "success" | "warning" | "danger"}
                icon={<stat.icon className="h-5 w-5" />}
              />
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <AppSectionCard className="mb-2 flex flex-col gap-4 p-4 md:flex-row">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search clients by name, email, or company..."
              className="h-11 rounded-2xl border-border bg-background pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="inline-flex rounded-2xl border border-input bg-background p-1">
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              className="h-9 gap-2"
              onClick={() => setViewMode("compact")}
            >
              <Rows3 className="h-4 w-4" />
              Compact
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              className="h-9 gap-2"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
          </div>
        </AppSectionCard>

        {/* Content Area */}
        {isLoading ? (
          <AppFeedbackState
            variant="loading"
            title="Loading clients"
            description="Fetching customer records and account details."
          />
        ) : loadError ? (
          <AppFeedbackState
            variant="error"
            title="Unable to load clients"
            description={loadError}
            action={{ label: "Try again", onClick: fetchClients }}
          />
        ) : filteredClients.length > 0 && viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                  transition={{ delay: prefersReducedMotion ? 0 : index * 0.04, duration: prefersReducedMotion ? 0 : 0.16 }}
                  className="group"
                >
                  <Card className="group relative h-full overflow-hidden rounded-3xl border-border/50 bg-gradient-to-br from-card to-card/90 shadow-md shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 motion-interactive motion-card-feedback">
                    <CardHeader className="pb-5">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground shadow-lg shadow-primary/20">
                        <span className="text-xl font-bold">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-semibold text-foreground motion-interactive-micro group-hover:text-primary transition-colors">
                        {client.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-muted-foreground/70">
                        <Building className="w-3.5 h-3.5 text-primary/50" />
                        <span className="text-xs">Residential Account</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground/80 transition-colors group-hover:bg-muted/60 group-hover:text-muted-foreground">
                          <Mail className="h-4 w-4 text-primary/60" />
                          <span className="truncate text-xs">
                            {client.contact_email || "No email"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground/80 transition-colors group-hover:bg-muted/60 group-hover:text-muted-foreground">
                          <Phone className="h-4 w-4 text-primary/60" />
                          <span className="text-xs">{client.contact_phone || "No phone"}</span>
                        </div>
                      </div>

                      <div className="border-t border-border/40 pt-5">
                        <Link
                          to={`/dashboard/clients/${client.id}`}
                          className="group/btn inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 font-medium text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:from-primary/95 hover:to-primary/85 motion-interactive transition-all"
                        >
                          View Profile
                          <ArrowRight className="w-4 h-4 motion-interactive-micro group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ delay: prefersReducedMotion ? 0 : index * 0.03, duration: prefersReducedMotion ? 0 : 0.16 }}
                >
                  <Card className="border-border/50 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-foreground">{client.name}</h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70">
                            <span className="inline-flex items-center">
                              <Mail className="mr-1 h-3.5 w-3.5 text-primary/50" />
                              {client.contact_email || "No email"}
                            </span>
                            <span className="inline-flex items-center">
                              <Phone className="mr-1 h-3.5 w-3.5 text-primary/50" />
                              {client.contact_phone || "No phone"}
                            </span>
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="gap-2 h-8 text-xs hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all">
                          <Link to={`/dashboard/clients/${client.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            Open
                          </Link>
                        </Button>
                      </div>
                      <Collapsible className="mt-3 border-t border-border/40 pt-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-2 px-0 text-xs text-muted-foreground/70 hover:text-foreground transition-colors">
                            More details
                            <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 text-xs text-muted-foreground/70">
                          {client.address ? client.address : "No address provided"}
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <AppFeedbackState
            variant="empty"
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
            title={searchQuery ? "No matching clients" : "No clients yet"}
            description={
              searchQuery
                ? `No results for "${searchQuery}". Try another keyword or clear your search.`
                : "Start building your customer base by adding your first client."
            }
            action={
              searchQuery
                ? {
                    label: "Clear search",
                    onClick: () => setSearchQuery(""),
                  }
                : {
                    label: "Add your first client",
                    onClick: () => setIsDialogOpen(true),
                  }
            }
          />
        )}
      </PageContainer>

      <SpreadsheetImporter
        isOpen={isImportOpen}
        onClose={setIsImportOpen}
        onImport={handleImport}
        title="Import Clients"
        description="Upload a CSV file containing client details. We'll map the columns for you."
        targetFields={[
          { key: "name", label: "Full Name", required: true },
          { key: "contact_email", label: "Email Address", required: true },
          { key: "contact_phone", label: "Phone Number" },
          { key: "address", label: "Address" },
        ]}
      />
    </div>
  );
}
