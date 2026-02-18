import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSupabaseCalculations,
  Calculation,
} from "@/hooks/useSupabaseCalculations";
import { useToast } from "@/hooks/useToast";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Trash2,
  Calculator,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Copy,
  MoreHorizontal,
  Filter,
  History as HistoryIcon,
  FileText,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { PageHero } from "@/components/shared/PageHero";
import { StatsRow, type StatItem } from "@/components/shared/StatsRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { storeCalculationPreset } from "@/lib/historyPresets";

export function History() {
  const { calculations, isLoading, deleteCalculation, saveCalculation } = useSupabaseCalculations();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [deleteTarget, setDeleteTarget] = useState<Calculation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cloneLoadingId, setCloneLoadingId] = useState<string | null>(null);

  const stats: StatItem[] = useMemo(() => {
    if (!calculations) return [];
    const types: Record<string, number> = {};
    calculations.forEach((c) => {
      types[c.calculation_type] = (types[c.calculation_type] || 0) + 1;
    });

    return [
      {
        id: "total",
        label: "Total Calculations",
        value: calculations.length,
        status: "neutral",
        icon: <Calculator className="w-4 h-4" />,
      },
      {
        id: "standard",
        label: "Standard Cycles",
        value: types["Standard Cycle"] || 0,
        status: "neutral",
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        id: "comparison",
        label: "Comparisons",
        value: types["Refrigerant Comparison"] || 0,
        status: "success",
        icon: <TrendingUp className="w-4 h-4" />,
      },
    ];
  }, [calculations]);

  const filteredCalculations = useMemo(() => {
    return calculations
      .filter((calc) => {
        const lowered = searchTerm.toLowerCase();
        const matchesSearch = lowered
          ? (calc.name || "")?.toLowerCase().includes(lowered) ||
            calc.calculation_type.toLowerCase().includes(lowered)
          : true;
        const matchesFilter = filterType === "all" || calc.calculation_type === filterType;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "name":
            return (a.name || a.calculation_type).localeCompare(b.name || b.calculation_type);
          default:
            return 0;
        }
      });
  }, [calculations, searchTerm, filterType, sortBy]);

  const getCalculationConfig = (type: string) => {
    switch (type) {
      case "Standard Cycle":
        return { icon: Calculator, color: "text-cyan-500", bg: "bg-cyan-500/10" };
      case "Refrigerant Comparison":
        return { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "Cascade Cycle":
        return { icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" };
      case "Troubleshooting":
        return { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" };
      default:
        return { icon: Calculator, color: "text-slate-500", bg: "bg-slate-500/10" };
    }
  };

  const getKeyResult = (calc: Calculation): string | null => {
    try {
      let results: any = calc.results;
      if (typeof results === "string") results = JSON.parse(results);
      if (!results) return null;

      if (calc.calculation_type === "Standard Cycle") {
        const cop = results?.performance?.cop || results?.data?.performance?.cop || results?.cop;
        return cop ? `COP: ${Number(cop).toFixed(2)}` : null;
      }
      if (calc.calculation_type === "Cascade Cycle") {
        const cop = results?.overall_performance?.cop || results?.data?.overall_performance?.cop || results?.overallCOP;
        return cop ? `Overall COP: ${Number(cop).toFixed(2)}` : null;
      }
      if (calc.calculation_type === "Refrigerant Comparison") {
        const count = calc.inputs?.refrigerants?.length;
        return count ? `${count} Fluids Compared` : null;
      }
      return null;
    } catch (_e) {
      return null;
    }
  };

  const calculationRoutes: Record<string, string> = {
    "Standard Cycle": "/standard-cycle",
    "Refrigerant Comparison": "/refrigerant-comparison",
    "Cascade Cycle": "/cascade-cycle",
    Troubleshooting: "/troubleshooting",
  };

  const handleRerunCalculation = useCallback(
    (calculation: Calculation) => {
      const route = calculationRoutes[calculation.calculation_type];
      if (!route) {
        addToast({ type: "error", title: "Unsupported", description: "Cannot open this calculation." });
        return;
      }
      storeCalculationPreset({
        type: calculation.calculation_type,
        inputs: calculation.inputs,
        results: calculation.results,
        sourceId: calculation.id,
      });
      navigate(route);
    },
    [addToast, navigate]
  );

  const handleCloneCalculation = useCallback(
    async (calculation: Calculation) => {
      const baseName = calculation.name || calculation.calculation_type;
      const clonedName = `${baseName} copy`;
      setCloneLoadingId(calculation.id);
      try {
        await saveCalculation(calculation.calculation_type, calculation.inputs, calculation.results, clonedName);
        addToast({ type: "success", title: "Cloned", description: "Calculation duplicated successfully." });
      } finally {
        setCloneLoadingId(null);
      }
    },
    [saveCalculation, addToast]
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCalculation(deleteTarget.id);
      setDeleteTarget(null);
      addToast({ type: "success", title: "Deleted", description: "Calculation removed." });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer variant="standard" className="history-page">
        <div className="history-page__loading">
          <div className="history-page__loading-spinner" />
          <span>Loading history...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="standard" className="history-page">
      <PageHero
        title="Calculation History"
        subtitle="View and manage your saved calculations and estimates"
        icon={<HistoryIcon className="w-5 h-5" />}
      />

      <StatsRow stats={stats} columns={3} />

      <div className="history-page__toolbar">
        <div className="history-page__search">
          <Search className="history-page__search-icon w-4 h-4" />
          <input
            type="text"
            placeholder="Search calculations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="history-page__search-input"
          />
        </div>

        <div className="history-page__filters">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="history-page__filter w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Standard Cycle">Standard Cycle</SelectItem>
              <SelectItem value="Refrigerant Comparison">Comparison</SelectItem>
              <SelectItem value="Cascade Cycle">Cascade Cycle</SelectItem>
              <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="history-page__filter w-[140px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="history-page__content">
        {filteredCalculations.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="w-12 h-12" />}
            title="No calculations found"
            description={searchTerm || filterType !== "all" ? "Try adjusting your filters" : "Save your first calculation to see it here"}
          />
        ) : (
          <div className="history-page__list">
            {filteredCalculations.map((calc) => {
              const config = getCalculationConfig(calc.calculation_type);
              const Icon = config.icon;
              const keyResult = getKeyResult(calc);

              return (
                <div key={calc.id} className="history-card">
                  <div className="history-card__icon">
                    <Icon className={cn("w-5 h-5", config.color)} />
                  </div>

                  <div className="history-card__content">
                    <div className="history-card__header">
                      <h3 className="history-card__name">{calc.name || calc.calculation_type}</h3>
                      <Badge variant="secondary" className="history-card__type">
                        {calc.calculation_type}
                      </Badge>
                    </div>

                    <div className="history-card__meta">
                      <span className="history-card__date">
                        <Clock className="w-3 h-3" />
                        {new Date(calc.created_at).toLocaleDateString()}
                      </span>
                      {keyResult && <span className="history-card__result">{keyResult}</span>}
                    </div>
                  </div>

                  <div className="history-card__actions">
                    <Button variant="ghost" size="sm" onClick={() => handleRerunCalculation(calc)}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloneCalculation(calc)}
                      disabled={cloneLoadingId === calc.id}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRerunCalculation(calc)}>
                          <RefreshCw className="w-4 h-4 mr-2" /> Rerun
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCloneCalculation(calc)}>
                          <Copy className="w-4 h-4 mr-2" /> Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(calc)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calculation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name || deleteTarget?.calculation_type}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}