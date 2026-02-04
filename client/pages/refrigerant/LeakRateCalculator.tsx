import React, { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import {
  ArrowLeft,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Info,
  History,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type Asset = {
  id: string;
  name: string;
  refrigerant_type: string | null;
  full_charge_lbs: number | null;
  serial_number: string | null;
};

type LogEntry = {
  id: string;
  created_at: string;
  amount_lbs: number;
  transaction_type: string;
};

export default function LeakRateCalculator() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [leakRate, setLeakRate] = useState<number | null>(null);
  const [daysElapsed, setDaysElapsed] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchAssets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAssetId) {
      fetchLogs(selectedAssetId);
    }
  }, [selectedAssetId]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, refrigerant_type, full_charge_lbs, serial_number")
        .not("full_charge_lbs", "is", null);

      if (data) setAssets(data);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (assetId: string) => {
    try {
      const { data, error } = await supabase
        .from("refrigerant_logs")
        .select("id, created_at, amount_lbs, transaction_type")
        .eq("asset_id", assetId)
        .eq("transaction_type", "charge")
        .order("created_at", { ascending: false });

      if (data) {
        setLogs(data);
        calculateRate(data);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const calculateRate = (logData: LogEntry[]) => {
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset || !asset.full_charge_lbs || logData.length < 1) {
      setLeakRate(null);
      setDaysElapsed(null);
      return;
    }

    // EPA Annualizing Method:
    // Leak Rate = [ (lbs added / lbs full charge) * (365 / days since last addition) ] * 100

    const latestAddition = logData[0];
    const lbsAdded = Number(latestAddition.amount_lbs);
    const fullCharge = Number(asset.full_charge_lbs);

    // If there's only one log, we compare it against 'today' minus created_at?
    // Or if there's a previous log, we use the interval between them.
    // Usually, the interval is since the LAST addition.

    let days = 365; // Default if no previous log (estimate 1 year)
    if (logData.length > 1) {
      days = differenceInDays(
        new Date(latestAddition.created_at),
        new Date(logData[1].created_at),
      );
    } else {
      // If only 1 log, EPA allows using the period since the last successful leak repair OR the last year.
      days = differenceInDays(new Date(), new Date(latestAddition.created_at));
    }

    // Clamp days to 1 to avoid division by zero
    days = Math.max(days, 1);
    setDaysElapsed(days);

    const rate = (lbsAdded / fullCharge) * (365 / days) * 100;
    setLeakRate(rate);
  };

  const getThresholdColor = (rate: number) => {
    if (rate > 30) return "text-red-600 dark:text-red-400";
    if (rate > 20) return "text-orange-600 dark:text-orange-400";
    if (rate > 10) return "text-amber-600 dark:text-amber-400";
    return "text-green-600 dark:text-green-400";
  };

  const getThresholdBadge = (rate: number) => {
    if (rate > 30) return <Badge variant="destructive">Critical Leak</Badge>;
    if (rate > 20) return <Badge className="bg-orange-500">High Leak</Badge>;
    if (rate > 10) return <Badge variant="secondary">Noticeable</Badge>;
    return (
      <Badge variant="outline" className="text-green-600 border-green-200">
        Stable
      </Badge>
    );
  };

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 pb-24">
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8 text-orange-600" />
            EPA Leak Rate Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Official EPA 608 mathematical compliance check.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Select Equipment</CardTitle>
          <CardDescription>
            Only assets with a defined "Full Charge" are shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Choose an HVAC/R Asset..." />
            </SelectTrigger>
            <SelectContent>
              {assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name} ({asset.refrigerant_type}) - S/N:{" "}
                  {asset.serial_number || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && assets.length === 0 && (
            <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              No assets found with design charge data. Update equipment details
              first.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedAssetId && selectedAsset && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Results Card */}
          <Card className="md:col-span-2 border-l-4 border-l-orange-600">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                Calculation Result
                {leakRate !== null && getThresholdBadge(leakRate)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {leakRate !== null ? (
                <>
                  <div className="text-center py-8">
                    <div
                      className={`text-6xl font-black mb-2 ${getThresholdColor(leakRate)}`}
                    >
                      {leakRate.toFixed(1)}%
                    </div>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">
                      Annualized Leak Rate
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Latest Addition</p>
                      <p className="font-bold">{logs[0]?.amount_lbs} lbs</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        Full Design Charge
                      </p>
                      <p className="font-bold">
                        {selectedAsset.full_charge_lbs} lbs
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        Days Since Last Check
                      </p>
                      <p className="font-bold">{daysElapsed} days</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Method</p>
                      <p className="font-bold">EPA Annualizing</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Compliance Threshold (Comfort)</span>
                      <span>10%</span>
                    </div>
                    <Progress
                      value={Math.min(leakRate * 3.33, 100)}
                      className="h-1"
                    />
                    {leakRate > 10 && (
                      <p className="text-xs text-orange-600 flex items-center gap-1 mt-2">
                        <AlertTriangle className="h-3 w-3" />
                        This exceeds the 10% threshold for comfort cooling.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No refrigerant additions logged for this asset.</p>
                  <p className="text-xs mt-2">
                    Logs must be of type "Charge" and linked to this asset.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Educational Card */}
          <Card className="bg-muted/30 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="h-4 w-4" />
                EPA EPA 608 Info
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The **Annualizing Method** is one of two EPA-approved ways to
                calculate leak rates.
              </p>
              <div className="p-3 bg-background rounded border font-mono">
                Rate = (lbs / charge) * (365 / days)
              </div>
              <p className="font-bold text-foreground">
                Compliance Thresholds:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>**Comfort Cooling:** 10%</li>
                <li>**Commercial Ref:** 20%</li>
                <li>**Industrial Process:** 30%</li>
              </ul>
              <p className="italic">
                If the leak rate exceeds these thresholds, the EPA requires
                repair within 30 days.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Log Table */}
      {selectedAssetId && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Additions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <Database className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{log.amount_lbs} lbs Added</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "PPP")}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
