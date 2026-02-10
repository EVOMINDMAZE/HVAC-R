import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type LogEntry = {
  id: string;
  created_at: string;
  transaction_type: string;
  amount_lbs: number;
  job_id: string | null;
  technician_name: string | null;
  cylinder: {
    cylinder_code: string;
    refrigerant_type: string;
  };
};

export default function ComplianceReport() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("refrigerant_logs")
        .select(
          `
          *,
          cylinder:cylinder_id (
            cylinder_code,
            refrigerant_type
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error",
        description: "Failed to load compliance logs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = [
      "Date",
      "Technician",
      "Cylinder Tag",
      "Refrigerant",
      "Action",
      "Amount (lbs)",
      "Job ID",
      "Notes",
    ];

    const csvContent = [
      headers.join(","),
      ...logs.map((log) =>
        [
          `"${format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}"`,
          `"${log.technician_name || "Unknown"}"`,
          `"${log.cylinder?.cylinder_code || "Deleted"}"`,
          `"${log.cylinder?.refrigerant_type || "N/A"}"`,
          `"${log.transaction_type}"`,
          log.amount_lbs,
          `"${log.job_id || ""}"`,
          `"${(log as any).notes || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `EPA_608_Log_${format(new Date(), "yyyyMMdd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "charge":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
      case "recover":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200";
      case "addition":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200";
      case "disposal":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/tools/refrigerant-inventory">
              <Button
                variant="ghost"
                size="sm"
                className="pl-0 hover:pl-2 transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inventory
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">EPA Compliance Log 📋</h1>
          <p className="text-muted-foreground mt-1">
            Audit-ready record of every refrigerant transaction.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            disabled={logs.length === 0 || loading}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-2">
                Loading logs...
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No usage logs found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tech</TableHead>
                    <TableHead>Cylinder</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Job ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{log.technician_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.cylinder?.cylinder_code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.cylinder?.refrigerant_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${getActionColor(log.transaction_type)} border-0`}
                        >
                          {log.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {log.amount_lbs} lbs
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.job_id || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
