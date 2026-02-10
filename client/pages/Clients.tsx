import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Plus,
  Search,
  Users,
  Settings,
  Trash2,
  CheckCircle2,
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
} from "lucide-react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SpreadsheetImporter } from "@/components/shared/SpreadsheetImporter";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

      // Get the company ID for the current user
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (companyError) throw companyError;

      if (companyData) {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("company_id", companyData.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setClients(data || []);
      }
    } catch (err: any) {
      console.error("Error fetching clients:", err);
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
          name: `${user.email?.split("@")[0]}'s Company` || "My HVAC Company",
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-slate-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[80px]" />
      </div>

      <PageContainer variant="standard">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2 text-cyan-600 font-medium tracking-wide">
              <Users className="w-5 h-5" />
              <span className="text-sm uppercase">Business Operations</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Client Management
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Organize your customers, track service history, and manage
              communication in one central hub.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4"
          >
            <Button
              variant="outline"
              className="h-12 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-900/40 rounded-xl gap-2 shadow-sm"
              onClick={handleExport}
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              className="h-12 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-900/40 rounded-xl gap-2 shadow-sm"
              onClick={() => setIsImportOpen(true)}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Import List</span>
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 h-12 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 group">
                  <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
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
                      className="text-sm font-semibold text-gray-700"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. John Smith"
                      className="rounded-xl border-gray-200 focus:ring-cyan-500"
                      value={newClient.name}
                      onChange={(e) =>
                        setNewClient({ ...newClient, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="rounded-xl border-gray-200 focus:ring-cyan-500"
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient({ ...newClient, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(555) 000-0000"
                      className="rounded-xl border-gray-200 focus:ring-cyan-500"
                      value={newClient.phone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="address"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Service Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="Street, City, Zip"
                      className="rounded-xl border-gray-200 focus:ring-cyan-500"
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
                    className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-8"
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
          </motion.div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              label: "Total Clients",
              value: clients.length,
              icon: Users,
              color: "cyan",
            },
            {
              label: "Active This Month",
              value: "12",
              icon: BarChart3,
              color: "slate",
            },
            {
              label: "Pending Follow-ups",
              value: "5",
              icon: Clock,
              color: "cyan",
            },
            {
              label: "Verified Profiles",
              value: "98%",
              icon: ShieldCheck,
              color: "emerald",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-4`}
              >
                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-card p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
            <Input
              placeholder="Search clients by name, email, or company..."
              className="pl-12 h-12 bg-white/80 dark:bg-slate-900/80 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20 rounded-2xl transition-all text-slate-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="h-12 rounded-2xl border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 px-6 gap-2 dark:text-slate-200"
          >
            <Settings className="w-5 h-5 text-gray-500" />
            <span>Filter</span>
          </Button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-card p-8 rounded-3xl border border-gray-100 dark:border-slate-800 space-y-4"
              >
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Card className="h-full rounded-[2rem] border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <CardHeader className="pb-4">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500 to-slate-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-cyan-200">
                        <span className="text-2xl font-bold">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
                        {client.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Residential Account
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/20 transition-colors">
                          <Mail className="w-4 h-4 text-cyan-500" />
                          <span className="truncate">
                            {client.contact_email || "No email"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/20 transition-colors">
                          <Phone className="w-4 h-4 text-cyan-500" />
                          <span>{client.contact_phone || "No phone"}</span>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          to={`/dashboard/clients/${client.id}`}
                          className="w-full inline-flex items-center justify-center h-12 rounded-2xl bg-slate-900 dark:bg-cyan-600 text-white font-medium hover:bg-slate-800 dark:hover:bg-cyan-700 transition-all gap-2 group/btn"
                        >
                          View Profile
                          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-card rounded-[3rem] border border-dashed border-gray-300 dark:border-slate-700"
          >
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No clients found
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different term or clear filters.`
                : "Start building your customer base by adding your first client."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 h-12 rounded-xl"
              >
                Add Your First Client
              </Button>
            )}
          </motion.div>
        )}
      </PageContainer>
      <Footer />

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
