import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil } from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { useToast } from "@/hooks/useToast";

interface RenameCalculationDialogProps {
  calculationId: string;
  initialName?: string;
  fallbackName: string;
  disabled?: boolean;
  className?: string;
}

export function RenameCalculationDialog({
  calculationId,
  initialName,
  fallbackName,
  disabled = false,
  className,
}: RenameCalculationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName || fallbackName);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateCalculation } = useSupabaseCalculations();
  const { addToast } = useToast();

  useEffect(() => {
    if (open) {
      setName(initialName || fallbackName);
    }
  }, [open, initialName, fallbackName]);

  const handleRename = async () => {
    const trimmed = name.trim();

    if (!trimmed) {
      addToast({
        type: "error",
        title: "Name required",
        description: "Enter a descriptive name before saving changes.",
      });
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await updateCalculation(calculationId, { name: trimmed });
      if (updated) {
        setOpen(false);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          disabled={disabled}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Pencil className="h-4 w-4" aria-hidden />
          )}
          <span>Rename</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Calculation</DialogTitle>
          <DialogDescription>
            Update the saved calculation name to keep your history organized.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rename-calculation">Calculation Name</Label>
            <Input
              id="rename-calculation"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={fallbackName}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleRename} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Saving
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
