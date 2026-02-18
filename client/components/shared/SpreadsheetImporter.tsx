import React, { useState, useCallback } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

// Generic interface for column mapping
export interface ColumnMapping {
  csvHeader: string;
  targetField: string;
}

export interface ImporterProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onImport: (data: any[]) => Promise<void>;
  targetFields: { key: string; label: string; required?: boolean }[];
  title?: string;
  description?: string;
}

export function SpreadsheetImporter({
  isOpen,
  onClose,
  onImport,
  targetFields,
  title = "Import Data",
  description = "Upload a CSV or Excel file to import data.",
}: ImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".xlsx"))
    ) {
      processFile(droppedFile);
    } else {
      setError("Please upload a valid .csv or .xlsx file.");
    }
  }, []);

  // Process file (CSV only for now, can extend to XLSX later with regex check)
  const processFile = (file: File) => {
    setFile(file);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5, // Preview first 5 rows
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setHeaders(results.meta.fields || []);
          setPreviewData(results.data);

          // Auto-guess mappings
          const initialMappings: Record<string, string> = {};
          results.meta.fields?.forEach((header) => {
            const normalizedHeader = header
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            const match = targetFields.find(
              (f) =>
                f.label.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                  normalizedHeader ||
                f.key.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                  normalizedHeader,
            );
            if (match) {
              initialMappings[match.key] = header;
            }
          });
          setMappings(initialMappings);
          setStep("map");
        } else {
          setError("No data found in file.");
        }
      },
      error: (err) => {
        setError(`Failed to parse file: ${err.message}`);
      },
    });
  };

  const handleImport = async () => {
    setIsUploading(true);
    setError(null);

    try {
      // Parse full file now
      if (!file) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const mappedData = results.data.map((row: any) => {
            const newRow: any = {};
            Object.entries(mappings).forEach(([targetKey, sourceHeader]) => {
              newRow[targetKey] = row[sourceHeader];
            });
            return newRow;
          });

          await onImport(mappedData);
          onClose(false);
          setStep("upload");
          setFile(null);
          setMappings({});
        },
        error: (err) => {
          setError(`Import failed: ${err.message}`);
          setIsUploading(false);
        },
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    setMappings({});
    setError(null);
    setStep("upload");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) reset();
        onClose(open);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "upload" && (
          <div
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              Drag & Drop or Click to Upload
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Supports .CSV files (Excel coming soon)
            </p>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && processFile(e.target.files[0])
              }
            />
          </div>
        )}

        {step === "map" && (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg flex items-start gap-3 border border-orange-100 dark:border-orange-900">
              <FileSpreadsheet className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  File: {file?.name}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Map your file columns to the database fields below.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto -mt-2"
                onClick={reset}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4">
              <div className="grid gap-4">
                {targetFields.map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-1 md:grid-cols-3 items-center gap-4"
                  >
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {field.label}{" "}
                        {field.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Target Field: {field.key}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Select
                        value={mappings[field.key] || ""}
                        onValueChange={(val) =>
                          setMappings((prev) => ({ ...prev, [field.key]: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column from file..." />
                        </SelectTrigger>
                        <SelectContent>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="__ignore__"
                            className="text-muted-foreground font-style-italic"
                          >
                            -- Ignore --
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Preview Table */}
            <div className="border rounded-md">
              <div className="p-2 bg-muted/50 text-xs font-semibold uppercase tracking-wider border-b">
                Data Preview (Based on Mapping)
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    {targetFields.slice(0, 4).map((f) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 3).map((row, i) => (
                    <TableRow key={i}>
                      {targetFields.slice(0, 4).map((f) => (
                        <TableCell key={f.key} className="text-xs">
                          {row[mappings[f.key] ?? ""] || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          {step === "map" && (
            <>
              <Button variant="outline" onClick={reset} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isUploading}>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import Data
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
