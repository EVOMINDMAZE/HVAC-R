import { useEffect, useState } from "react";
import { ArrowRight, DollarSign, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface SellingPoint {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  actionLabel: string;
  actionUrl?: string;
}

interface SellingPointsCardProps {
  context: "client" | "inventory";
  data: any; // The client object (with equipment) or inventory items
}

export function SellingPointsCard({ context, data }: SellingPointsCardProps) {
  const [points, setPoints] = useState<SellingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const sellingPointsEnabled = import.meta.env.VITE_ENABLE_SELLING_POINTS === "true";

  useEffect(() => {
    if (sellingPointsEnabled && data) {
      analyzeData();
    } else {
      setLoading(false);
      setPoints([]);
    }
  }, [data, sellingPointsEnabled]);

  const analyzeData = async () => {
    try {
      setLoading(true);
      console.log("Analyzing with data:", { context, data }); // DEBUG
      const { data: result, error } = await supabase.functions.invoke(
        "analyze-selling-points",
        {
          body: { context, data },
        },
      );

      console.log("Analyze Selling Points Result:", result, error); // DEBUG

      if (error) throw error;
      if (result && result.sellingPoints) {
        setPoints(result.sellingPoints);
      }
    } catch (err) {
      console.error("Analysis Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null; // Don't show anything while loading to avoid layout shift, or show skeleton?
  // Better: Silent load. If nothing found, show nothing.

  if (points.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      <AnimatePresence>
        {points.map((point) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              className={`border-l-4 shadow-md ${
                point.severity === "critical"
                  ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/10"
                  : point.severity === "high"
                    ? "border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
                    : point.severity === "medium"
                      ? "border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10"
                      : "border-l-green-500"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-full ${
                        point.severity === "critical"
                          ? "bg-red-100 text-red-600"
                          : point.severity === "high"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {point.severity === "high" ||
                      point.severity === "critical" ? (
                        <DollarSign className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {point.title}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={`uppercase text-[10px] tracking-wider font-bold ${
                      point.severity === "critical"
                        ? "text-red-600 border-red-200"
                        : point.severity === "high"
                          ? "text-amber-600 border-amber-200"
                          : "text-orange-600 border-orange-200"
                    }`}
                  >
                    {point.severity} Priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  {point.description}
                </p>
              </CardContent>
              <CardFooter className="pt-0 flex justify-end">
                <Button
                  size="sm"
                  className={`${
                    point.severity === "critical"
                      ? "bg-red-600 hover:bg-red-700"
                      : point.severity === "high"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-orange-600 hover:bg-orange-700"
                  } text-white border-none shadow-sm`}
                >
                  {point.actionLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
