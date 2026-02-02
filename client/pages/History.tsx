import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSupabaseCalculations,
  Calculation,
} from "@/hooks/useSupabaseCalculations";
import { useToast } from "@/hooks/useToast";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
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
  MoreVertical,
  Filter,
  ArrowUpRight,
  History as HistoryIcon,
  Pencil,
  FileText
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Calculation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cloneLoadingId, setCloneLoadingId] = useState<string | null>(null);

  // --- Stats Computation ---
  const stats = useMemo(() => {
    if (!calculations) return { total: 0, types: {} };
    const types: Record<string, number> = {};
    calculations.forEach(c => {
      types[c.calculation_type] = (types[c.calculation_type] || 0) + 1;
    });
    return { total: calculations.length, types };
  }, [calculations]);

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
        return { icon: Calculator, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200 dark:border-blue-900" };
      case "Refrigerant Comparison":
        return { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-900" };
      case "Cascade Cycle":
        return { icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-200 dark:border-purple-900" };
      case "Troubleshooting":
        return { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-200 dark:border-amber-900" };
      default:
        return { icon: Calculator, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-200 dark:border-slate-800" };
    }
  };

  const getKeyResult = (calc: Calculation): string | null => {
    // Logic to extract a SINGLE "Hero" metric to show on card
    try {
      let results: any = calc.results;
      if (typeof results === 'string') results = JSON.parse(results);
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
      if (calc.calculation_type === "Troubleshooting") {
        return results?.summary ? "Diagnosis Complete" : null;
      }
      return null;
    } catch (e) { return null; }
  };

  const calculationRoutes: Record<string, string> = {
    "Standard Cycle": "/standard-cycle",
    "Refrigerant Comparison": "/refrigerant-comparison",
    "Cascade Cycle": "/cascade-cycle",
    "Troubleshooting": "/troubleshooting",
  };

  const handleRerunCalculation = useCallback((calculation: Calculation) => {
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
  }, [addToast, navigate]);

  const handleCloneCalculation = useCallback(async (calculation: Calculation) => {
    const baseName = calculation.name || calculation.calculation_type;
    const clonedName = `${baseName} copy`;
    setCloneLoadingId(calculation.id);
    try {
      await saveCalculation(calculation.calculation_type, calculation.inputs, calculation.results, clonedName);
      addToast({ type: "success", title: "Cloned", description: "Calculation duplicated successfully." });
    } finally {
      setCloneLoadingId(null);
    }
  }, [saveCalculation, addToast]);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <PageContainer variant="standard">

        {/* Header Section */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2">
                History & Analysis
              </h1>
              <p className="text-muted-foreground">
                Manage your saved simulations and diagnostic sessions.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Items</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">{stats.types["Standard Cycle"] || 0}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Standard Cycles</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-purple-500 mb-1">{stats.types["Cascade Cycle"] || 0}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cascade Cycles</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <div className="text-3xl font-bold text-amber-500 mb-1">{stats.types["Troubleshooting"] || 0}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Diagnostics</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-card rounded-xl border shadow-sm p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-10 backdrop-blur-xl bg-card/80">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue placeholder="Filter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Standard Cycle">Standard Cycle</SelectItem>
                <SelectItem value="Refrigerant Comparison">Ref Comparison</SelectItem>
                <SelectItem value="Cascade Cycle">Cascade Cycle</SelectItem>
                <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calculations Grid */}
        {filteredCalculations.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-muted/30 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <HistoryIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-medium text-foreground">No records found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {searchTerm ? "Try adjusting your filters or search terms." : "You haven't saved any calculations yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCalculations.map((calc, idx) => {
              const cfg = getCalculationConfig(calc.calculation_type);
              const heroResult = getKeyResult(calc);

              return (
                <div
                  key={calc.id}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className="group relative flex flex-col bg-card hover:bg-card/80 border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${cfg.bg.replace('/10', '')}`} />

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                          <cfg.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground line-clamp-1" title={calc.name || calc.calculation_type}>
                            {calc.name || calc.calculation_type}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(calc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRerunCalculation(calc)}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Re-run
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCloneCalculation(calc)}>
                            {cloneLoadingId === calc.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedCalculation(calc); setShowDetails(true); }}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(calc)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                        <Badge variant="outline" className="font-normal bg-background/50">
                          {calc.calculation_type}
                        </Badge>
                      </div>

                      {heroResult && (
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="text-sm font-medium text-foreground text-center">
                            {heroResult}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-5 pt-4 border-t border-border/50 flex gap-2">
                      <Button
                        className="flex-1 bg-white dark:bg-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-slate-700 border-border"
                        variant="outline"
                        onClick={() => handleRerunCalculation(calc)}
                      >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Re-run
                      </Button>
                      <RenameCalculationDialog
                        calculationId={calc.id}
                        initialName={calc.name ?? undefined}
                        fallbackName={calc.calculation_type}
                        disabled={isDeleting}
                        className="h-9 w-9 p-0 aspect-square"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>


      {/* Dialogs */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle>Calculation Details</DialogTitle>
            <DialogDescription>Full inputs and results for this session.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {selectedCalculation && <CalculationDetailsModal calculation={selectedCalculation} />}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. "{(deleteTarget?.name || "Untitled")}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div >
  );
}
