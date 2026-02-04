import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Archive,
  ChevronRight,
  Activity,
  FileText,
  Calculator,
  Download,
} from "lucide-react";
import Papa from "papaparse";
import { Link } from "react-router-dom";
import { AddCylinderDialog } from "@/components/refrigerant/AddCylinderDialog";
import { LogRefrigerantDialog } from "@/components/refrigerant/LogRefrigerantDialog";
import { WarrantyCard } from "@/components/shared/WarrantyCard";
import { SellingPointsCard } from "@/components/shared/SellingPointsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/lib/supabase";

type Cylinder = Database["public"]["Tables"]["refrigerant_cylinders"]["Row"];

export default function RefrigerantInventory() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [cylinders, setCylinders] = useState<Cylinder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // active, empty, all

  useEffect(() => {
    if (user) {
      fetchCylinders();
    }
  }, [user, filter]);

  const fetchCylinders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("refrigerant_cylinders")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCylinders(data || []);
    } catch (error: any) {
      console.error("Error fetching cylinders:", error);
      toast({
        title: "Error",
        description: "Failed to load refrigerant inventory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!cylinders || cylinders.length === 0) {
      toast({
        title: "No Data",
        description: "There is no inventory to export.",
      });
      return;
    }

    const csv = Papa.unparse(cylinders);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `refrigerant_inventory_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Started",
      description: "Your inventory list is downloading.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "empty":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Refrigerant Bank ❄️
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your EPA 608 cylinders and compliance.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Link to="/tools/refrigerant-report">
            <Button variant="outline" className="w-full md:w-auto">
              <FileText className="mr-2 h-4 w-4" /> Compliance Log
            </Button>
          </Link>
          <Link to="/tools/leak-rate-calculator">
            <Button variant="outline" className="w-full md:w-auto">
              <Calculator className="mr-2 h-4 w-4" /> Leak Rate
            </Button>
          </Link>
          <AddCylinderDialog
            onCylinderAdded={() => {
              fetchCylinders();
              setFilter("active");
            }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-orange-600">
              {cylinders.filter((c) => c.status === "active").length}
            </div>
            <div className="text-xs text-muted-foreground">Active Tanks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-green-600">
              {cylinders
                .reduce(
                  (acc, c) =>
                    acc +
                    (c.status === "active" ? Number(c.current_weight_lbs) : 0),
                  0,
                )
                .toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Lbs on Hand</div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Layer */}
      <SellingPointsCard context="inventory" data={{ items: cylinders }} />

      {/* Warranty Auto-Pilot */}
      <WarrantyCard />

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {["active", "empty", "returned", "all"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize whitespace-nowrap"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10">
            <Activity className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">
              Loading inventory...
            </p>
          </div>
        ) : cylinders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Archive className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No cylinders found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first refrigerant cylinder to start tracking.
              </p>
              <AddCylinderDialog
                onCylinderAdded={() => {
                  fetchCylinders();
                  setFilter("active");
                }}
              />
            </CardContent>
          </Card>
        ) : (
          cylinders.map((cylinder) => (
            <motion.div
              key={cylinder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">
                          {cylinder.refrigerant_type}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {cylinder.cylinder_code}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Weight:{" "}
                        <span className="font-medium text-foreground">
                          {cylinder.current_weight_lbs} lbs
                        </span>{" "}
                        / {cylinder.initial_weight_lbs} lbs
                      </div>
                    </div>
                    <Badge className={getStatusColor(cylinder.status)}>
                      {cylinder.status}
                    </Badge>
                  </div>
                  <LogRefrigerantDialog
                    cylinder={cylinder}
                    onLogSuccess={() => {
                      fetchCylinders();
                      toast({
                        title: "Updated",
                        description: "Inventory usage recorded.",
                      });
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
