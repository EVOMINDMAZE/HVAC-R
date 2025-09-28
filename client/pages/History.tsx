import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSupabaseCalculations,
  Calculation,
} from "@/hooks/useSupabaseCalculations";
import { useToast } from "@/hooks/useToast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  History as HistoryIcon,
  Search,
  Calendar,
  Trash2,
  Calculator,
  TrendingUp,
  BarChart3,
  Eye,
  RefreshCw,
  Copy,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalculationDetailsModal } from "@/components/CalculationDetailsModal";
import { RenameCalculationDialog } from "@/components/RenameCalculationDialog";
import { storeCalculationPreset } from "@/lib/historyPresets";

export function History() {
  const {
    calculations,
    isLoading,
    deleteCalculation,
    updateCalculation,
    saveCalculation,
  } = useSupabaseCalculations();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [selectedCalculation, setSelectedCalculation] =
    useState<Calculation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Calculation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cloneLoadingId, setCloneLoadingId] = useState<string | null>(null);

  const filteredCalculations = useMemo(() => {
    return calculations
      .filter((calc) => {
        const lowered = searchTerm.toLowerCase();
        const matchesSearch = lowered
          ? (calc.name || "")?.toLowerCase().includes(lowered) ||
            calc.calculation_type.toLowerCase().includes(lowered)
          : true;
        const matchesFilter =
          filterType === "all" || calc.calculation_type === filterType;

        const tagLower = tagFilter.trim().toLowerCase();
        const matchesTag = tagLower
          ? (calc.tags &&
              Array.isArray(calc.tags) &&
              calc.tags.join(" ").toLowerCase().includes(tagLower)) ||
            (calc.inputs &&
              JSON.stringify(calc.inputs).toLowerCase().includes(tagLower)) ||
            (calc.results &&
              JSON.stringify(calc.results).toLowerCase().includes(tagLower))
          : true;

        return matchesSearch && matchesFilter && matchesTag;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "oldest":
            return (
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            );
          case "name":
            return (a.name || a.calculation_type).localeCompare(
              b.name || b.calculation_type,
            );
          default:
            return 0;
        }
      });
  }, [calculations, searchTerm, filterType, sortBy, tagFilter]);

  const getCalculationIcon = (type: string) => {
    switch (type) {
      case "Standard Cycle":
        return <Calculator className="h-5 w-5 text-blue-600" />;
      case "Refrigerant Comparison":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "Cascade Cycle":
        return <BarChart3 className="h-5 w-5 text-purple-600" />;
      default:
        return <Calculator className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCalculationColor = (type: string) => {
    switch (type) {
      case "Standard Cycle":
        return "bg-blue-100 text-blue-800";
      case "Refrigerant Comparison":
        return "bg-green-100 text-green-800";
      case "Cascade Cycle":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatResultSummary = (calc: Calculation) => {
    try {
      let results: any = calc.results || {};
      if (typeof results === "string") {
        try {
          results = JSON.parse(results);
        } catch (e) {
          // ignore parse errors
        }
      }

      const pick = (obj: any, paths: string[][]) => {
        if (typeof obj === "string") return undefined;
        for (const path of paths) {
          let cur = obj;
          let ok = true;
          for (const key of path) {
            if (cur === undefined || cur === null) {
              ok = false;
              break;
            }
            cur = cur[key];
          }
          if (ok && cur !== undefined) return cur;
        }
        return undefined;
      };

      const readNum = (v: any) => {
        if (v === undefined || v === null) return null;
        if (typeof v === "number") return v;
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
        const parsed = Number(String(v).replace(/[^0-9eE+\-\.]/g, ""));
        return Number.isNaN(parsed) ? null : parsed;
      };

      switch (calc.calculation_type) {
        case "Standard Cycle": {
          const copRaw = pick(results, [
            ["data", "performance", "cop"],
            ["performance", "cop"],
            ["data", "cop"],
            ["cop"],
          ]);
          const cop = readNum(copRaw);
          return cop !== undefined && cop !== null
            ? `COP: ${Number(cop).toFixed(2)}`
            : "No COP data";
        }
        case "Refrigerant Comparison":
          return calc.inputs?.refrigerants
            ? `${calc.inputs.refrigerants.length} refrigerants compared`
            : "Comparison data";
        case "Cascade Cycle": {
          const overallRaw = pick(results, [
            ["data", "overall_performance", "cop"],
            ["overall_performance", "cop"],
            ["data", "performance", "overallCOP"],
            ["overallCOP"],
            ["data", "overallCOP"],
          ]);
          const overall = readNum(overallRaw);

          if (overall !== undefined && overall !== null)
            return `Overall COP: ${Number(overall).toFixed(2)}`;

          // Try to compute overall COP from lt/ht perf if available in saved results
          const lt =
            pick(results, [
              ["data", "lt_cycle_performance"],
              ["lt_cycle_performance"],
              ["data", "lt_cycle"],
              ["lt_cycle"],
              ["data", "performance", "lt_cycle"],
            ]) || {};
          const ht =
            pick(results, [
              ["data", "ht_cycle_performance"],
              ["ht_cycle_performance"],
              ["data", "ht_cycle"],
              ["ht_cycle"],
              ["data", "performance", "ht_cycle"],
            ]) || {};

          const readNum = (v: any) => {
            if (v === undefined || v === null) return null;
            const n = Number(v);
            if (!Number.isNaN(n)) return n;
            const parsed = Number(String(v).replace(/[^0-9eE+\-\.]/g, ""));
            return Number.isNaN(parsed) ? null : parsed;
          };

          const deepFind = (obj: any, keys: string[]) => {
            if (!obj) return null;
            if (typeof obj !== "object") return null;
            for (const k of keys) {
              if (obj[k] !== undefined && obj[k] !== null) return obj[k];
            }
            for (const val of Object.values(obj)) {
              if (val && typeof val === "object") {
                const found = deepFind(val, keys);
                if (found !== null && found !== undefined) return found;
              }
            }
            return null;
          };

          const ltWork =
            readNum(
              pick(lt, [
                ["work_of_compression_kj_kg"],
                ["work_input_kj_kg"],
                ["work_of_compression"],
                ["work_kj_kg"],
                ["work"],
              ]) ??
                deepFind(results, [
                  "lt_work",
                  "lt_work_kj_kg",
                  "lt_work_kjkg",
                  "work_lt",
                ]),
            ) || 0;
          const htWork =
            readNum(
              pick(ht, [
                ["work_of_compression_kj_kg"],
                ["work_input_kj_kg"],
                ["work_of_compression"],
                ["work_kj_kg"],
                ["work"],
              ]) ??
                deepFind(results, [
                  "ht_work",
                  "ht_work_kj_kg",
                  "ht_work_kjkg",
                  "work_ht",
                ]),
            ) || 0;
          const ltRe =
            readNum(
              pick(lt, [
                ["refrigeration_effect_kj_kg"],
                ["refrigeration_effect"],
                ["refrigeration_effect_kjkg"],
              ]) ?? deepFind(results, ["lt_refrigeration_effect", "lt_re"]),
            ) || 0;
          const htRe =
            readNum(
              pick(ht, [
                ["refrigeration_effect_kj_kg"],
                ["refrigeration_effect"],
                ["refrigeration_effect_kjkg"],
              ]) ?? deepFind(results, ["ht_refrigeration_effect", "ht_re"]),
            ) || 0;

          const totalWork = ltWork + htWork;
          const totalRe = ltRe + htRe;
          if (totalWork > 0 && Number.isFinite(totalRe)) {
            return `Overall COP: ${(totalRe / totalWork).toFixed(2)}`;
          }

          // If we couldn't compute overall, show per-cycle COPs if available
          const ltCop = readNum(
            pick(lt, [["cop"], ["COP"], ["cycle_cop"], ["cop_kj"]]) ??
              deepFind(results, ["lt_cop", "ltCOP", "lowCOP"]),
          );
          const htCop = readNum(
            pick(ht, [["cop"], ["COP"], ["cycle_cop"], ["cop_kj"]]) ??
              deepFind(results, ["ht_cop", "htCOP", "highCOP"]),
          );

          if (
            (ltCop !== null && ltCop !== undefined) ||
            (htCop !== null && htCop !== undefined)
          ) {
            const parts: string[] = [];
            if (ltCop !== null && ltCop !== undefined)
              parts.push(`LT COP: ${Number(ltCop).toFixed(3)}`);
            if (htCop !== null && htCop !== undefined)
              parts.push(`HT COP: ${Number(htCop).toFixed(3)}`);
            return parts.join(" • ");
          }

          return "No COP data";
        }
        default:
          return "Calculation complete";
      }
    } catch {
      return "Calculation complete";
    }
  };

  const calculationRoutes = useMemo(
    () => ({
      "Standard Cycle": "/standard-cycle",
      "Refrigerant Comparison": "/refrigerant-comparison",
      "Cascade Cycle": "/cascade-cycle",
    }),
    [],
  );

  const handleRerunCalculation = useCallback(
    (calculation: Calculation) => {
      const route = calculationRoutes[calculation.calculation_type];
      if (!route) {
        addToast({
          type: "error",
          title: "Unsupported calculation",
          description:
            "We couldn't determine which simulator to open for this record.",
        });
        return;
      }

      storeCalculationPreset({
        type: calculation.calculation_type,
        inputs: calculation.inputs,
        results: calculation.results,
        sourceId: calculation.id,
      });

      addToast({
        type: "info",
        title: "Loading saved inputs",
        description: `Opening ${calculation.calculation_type} with your saved settings.`,
      });

      navigate(route);
    },
    [addToast, calculationRoutes, navigate],
  );

  const handleCloneCalculation = useCallback(
    async (calculation: Calculation) => {
      const baseName = calculation.name || calculation.calculation_type;
      const clonedName = `${baseName} copy (${new Date().toLocaleString()})`;
      setCloneLoadingId(calculation.id);
      try {
        await saveCalculation(
          calculation.calculation_type,
          calculation.inputs,
          calculation.results,
          clonedName,
        );
      } finally {
        setCloneLoadingId(null);
      }
    },
    [saveCalculation],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    try {
      const success = await deleteCalculation(deleteTarget.id);
      if (success) {
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, deleteCalculation]);

  const openDeleteDialog = useCallback((calculation: Calculation) => {
    setDeleteTarget(calculation);
  }, []);

  const handleCancelDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }
    setDeleteTarget(null);
  }, [isDeleting]);

  const handleViewDetails = (calculation: Calculation) => {
    setSelectedCalculation(calculation);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header variant="dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your calculations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <HistoryIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Calculation History
            </h1>
          </div>
          <p className="text-gray-600">
            View and manage all your saved calculations
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search calculations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Standard Cycle">Standard Cycle</SelectItem>
                  <SelectItem value="Refrigerant Comparison">
                    Refrigerant Comparison
                  </SelectItem>
                  <SelectItem value="Cascade Cycle">Cascade Cycle</SelectItem>
                </SelectContent>
              </Select>

              {/* Tag / Label filter */}
              <Input
                placeholder="Filter by tag or label"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="md:col-span-1"
                aria-label="Filter by tag"
              />

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-sm">
                  {filteredCalculations.length} calculation
                  {filteredCalculations.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculations Grid */}
        {filteredCalculations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterType !== "all"
                  ? "No matching calculations"
                  : "No calculations yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Start by running your first calculation from the dashboard"}
              </p>
              {!searchTerm && filterType === "all" && (
                <Button>Go to Dashboard</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCalculations.map((calculation) => (
              <Card
                key={calculation.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getCalculationIcon(calculation.calculation_type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {calculation.name || calculation.calculation_type}
                        </CardTitle>
                        <Badge
                          className={`text-xs mt-1 ${getCalculationColor(calculation.calculation_type)}`}
                          variant="secondary"
                        >
                          {calculation.calculation_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(calculation.created_at).toLocaleDateString()}
                    </div>

                    <p className="text-sm text-gray-700">
                      {formatResultSummary(calculation)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(calculation)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRerunCalculation(calculation)}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Re-run
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloneCalculation(calculation)}
                        disabled={cloneLoadingId === calculation.id}
                        className="flex items-center gap-1"
                      >
                        {cloneLoadingId === calculation.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {cloneLoadingId === calculation.id
                          ? "Cloning"
                          : "Clone"}
                      </Button>
                      <RenameCalculationDialog
                        calculationId={calculation.id}
                        initialName={calculation.name ?? undefined}
                        fallbackName={calculation.calculation_type}
                        disabled={
                          isDeleting || cloneLoadingId === calculation.id
                        }
                        className="!h-8"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(calculation)}
                        className="flex items-center gap-1 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete calculation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "
              {deleteTarget?.name || deleteTarget?.calculation_type}", including
              all saved inputs and results. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={handleCancelDelete}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCalculation?.name ||
                selectedCalculation?.calculation_type}
            </DialogTitle>
            <DialogDescription>
              Calculation details and results
            </DialogDescription>
          </DialogHeader>

          {selectedCalculation && (
            <CalculationDetailsModal calculation={selectedCalculation} />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
