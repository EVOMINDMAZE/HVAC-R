import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfessionalFeatures } from "@/components/ProfessionalFeatures";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { FileText, Search } from "lucide-react";

export function AdvancedReporting() {
  const { calculations, isLoading } = useSupabaseCalculations();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return calculations;
    return calculations.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.calculation_type || "").toLowerCase().includes(q),
    );
  }, [calculations, query]);

  const selected = useMemo(
    () => filtered.find((c) => c.id === selectedId) || null,
    [filtered, selectedId],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" /> Advanced Reporting
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                History
                <Badge variant="outline">{calculations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Input
                  placeholder="Search by name or type"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button variant="outline" size="icon" aria-label="search">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[65vh] overflow-auto">
                {isLoading && (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                )}
                {!isLoading && filtered.length === 0 && (
                  <div className="text-sm text-muted-foreground">No items</div>
                )}
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-3 rounded border hover:bg-blue-50 transition ${
                      selectedId === c.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="text-sm font-semibold truncate">
                      {c.name ||
                        `${c.calculation_type} – ${new Date(c.created_at).toLocaleString()}`}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{c.calculation_type}</Badge>
                      <span>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {selected ? (
              <ProfessionalFeatures
                cycleData={selected.inputs?.cycleData || selected.inputs}
                results={selected.results}
                refrigerant={
                  selected.inputs?.refrigerant ||
                  selected.results?.refrigerant ||
                  "R134a"
                }
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select an item to build a report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Choose a calculation from the list to generate a
                    professional PDF/CSV and chart package.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdvancedReporting;
