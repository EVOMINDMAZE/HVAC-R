import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Building,
  Phone,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
} from "lucide-react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHero } from "@/components/shared/PageHero";
import { StatsRow, type StatItem } from "@/components/shared/StatsRow";
import { EmptyState } from "@/components/shared/EmptyState";

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
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  async function handleCreateClient() {
    if (!newClient.name || !newClient.email) {
      addToast({
        title: "Missing Information",
        description: "Client name and email are required.",
        type: "error",
      });
      return;
    }

    if (!user) return;

    setIsCreating(true);

    try {
      const { data: companyData } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let companyId = companyData?.id;

      if (!companyId) {
        const { data: newCompany } = await supabase
          .from("companies")
          .insert({ user_id: user.id, name: `${user.email?.split("@")[0]}'s Company` })
          .select()
          .single();
        if (newCompany) companyId = newCompany.id;
      }

      const { error } = await supabase.from("clients").insert({
        name: newClient.name,
        contact_email: newClient.email,
        contact_phone: newClient.phone,
        address: newClient.address,
        company_id: companyId,
      });

      if (error) throw error;

      addToast({
        title: "Success",
        description: "Client created successfully.",
        type: "success",
      });

      setIsDialogOpen(false);
      setNewClient({ name: "", email: "", phone: "", address: "" });
      fetchClients();
    } catch (err: any) {
      addToast({
        title: "Error",
        description: err.message || "Failed to create client.",
        type: "error",
      });
    } finally {
      setIsCreating(false);
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
    link.href = URL.createObjectURL(blob);
    link.download = `clients_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    addToast({
      title: "Export Started",
      description: "Your client list is downloading.",
      type: "success",
    });
  }

  const filteredClients = useMemo(() => {
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.address && client.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clients, searchQuery]);

  const stats: StatItem[] = useMemo(() => {
    const total = clients.length;
    const thisMonth = clients.filter((c) => {
      const created = new Date(c.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return [
      {
        id: "total",
        label: "Total Clients",
        value: total,
        status: "neutral",
        icon: <Users className="w-4 h-4" />,
      },
      {
        id: "new",
        label: "New This Month",
        value: thisMonth,
        status: "success",
        icon: <Plus className="w-4 h-4" />,
      },
      {
        id: "active",
        label: "Active",
        value: total,
        status: "success",
        icon: <Building className="w-4 h-4" />,
      },
    ];
  }, [clients]);

  return (
    <PageContainer variant="standard" className="clients-page">
      <PageHero
        title="Clients"
        subtitle="Manage your customer relationships and contact information"
        icon={<Users className="w-5 h-5" />}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={clients.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client's information to add them to your list.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Company or person name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@example.com"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, City, ST"
                      value={newClient.address}
                      onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClient} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Add Client"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <StatsRow stats={stats} columns={3} />

      <div className="clients-page__toolbar">
        <div className="clients-page__search">
          <Search className="clients-page__search-icon w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clients-page__search-input"
          />
        </div>
      </div>

      <div className="clients-page__content">
        {isLoading ? (
          <div className="clients-page__loading">
            <div className="clients-page__loading-spinner" />
            <span>Loading clients...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="No clients found"
            description={searchQuery ? "Try adjusting your search" : "Add your first client to get started"}
            action={!searchQuery ? { label: "Add Client", onClick: () => setIsDialogOpen(true) } : undefined}
          />
        ) : (
          <div className="clients-page__grid">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="client-card"
                onClick={() => navigate(`/dashboard/clients/${client.id}`)}
              >
                <div className="client-card__header">
                  <div className="client-card__avatar">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="client-card__menu">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/clients/${client.id}`); }}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/clients/${client.id}?edit=true`); }}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="client-card__body">
                  <h3 className="client-card__name">{client.name}</h3>
                  <p className="client-card__email">{client.contact_email}</p>
                </div>

                <div className="client-card__meta">
                  {client.contact_phone && (
                    <div className="client-card__meta-item">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{client.contact_phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="client-card__meta-item">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}