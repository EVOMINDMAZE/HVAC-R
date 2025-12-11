import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save, Loader2 } from 'lucide-react';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';

interface SaveCalculationProps {
  calculationType: string;
  inputs: any;
  results: any;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function SaveCalculation({
  calculationType,
  inputs,
  results,
  disabled = false,
  trigger
}: SaveCalculationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { saveCalculation, findMatchingCalculation, updateCalculation } = useSupabaseCalculations();

  const handleSave = async () => {
    if (!inputs || !results) return;

    setIsSaving(true);
    try {
      // If a matching calculation already exists (auto-saved), update its name instead of creating a duplicate
      const existing = findMatchingCalculation(inputs, results);
      if (existing) {
        const updated = await updateCalculation(existing.id, { name: name || `${calculationType} - ${new Date().toLocaleDateString()}` });
        if (updated) {
          setIsOpen(false);
          setName('');
        }
        return;
      }

      const savedCalculation = await saveCalculation(
        calculationType,
        inputs,
        results,
        name || `${calculationType} - ${new Date().toLocaleDateString()}`
      );

      if (savedCalculation) {
        setIsOpen(false);
        setName('');
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Calculation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Calculation</DialogTitle>
          <DialogDescription>
            Save this {calculationType.toLowerCase()} calculation to your history for future reference.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="calculation-name">
              Calculation Name (Optional)
            </Label>
            <Input
              id="calculation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${calculationType} - ${new Date().toLocaleDateString()}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
