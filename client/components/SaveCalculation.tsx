import { useState, useEffect } from 'react';
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
import { Save, Loader2, Camera, MapPin, Briefcase } from 'lucide-react';
import { useSupabaseCalculations } from '@/hooks/useSupabaseCalculations';
import { useJob } from '@/context/JobContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkillTracker } from '@/hooks/useSkillTracker';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';

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
  const { currentJob } = useJob();
  const { user } = useSupabaseAuth();
  const { location, getLocation, loading: geoLoading } = useGeolocation();
  const { trackSkill } = useSkillTracker();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) getLocation();
  }, [isOpen]);

  const handleSave = async () => {
    if (!inputs || !results) return;

    setIsSaving(true);
    try {
      // If a matching calculation already exists (auto-saved), update its name instead of creating a duplicate
      const existing = findMatchingCalculation(inputs, results);
      // Only skip if no new context is being added. If we have a project or file, we probably want to save it explicitly.
      // For now, keeping original logic for simplicity, but in future might want to force save if context exists.
      if (existing && !file && !currentJob) {
        const updated = await updateCalculation(existing.id, { name: name || `${calculationType} - ${new Date().toLocaleDateString()}` });
        if (updated) {
          setIsOpen(false);
          setName('');
          setFile(null);
        }
        return;
      }

      const evidenceUrls: string[] = [];
      if (file && user) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('calculation-evidence')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('calculation-evidence')
            .getPublicUrl(fileName);
          evidenceUrls.push(publicUrlData.publicUrl);
        } else {
          console.error("Upload error:", uploadError);
        }
      }

      const savedCalculation = await saveCalculation(
        calculationType,
        inputs,
        results,
        name || `${calculationType} - ${new Date().toLocaleDateString()}`,
        {
          project_id: currentJob?.id,
          location_lat: location?.lat,
          location_lng: location?.lng,
          evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : undefined
        }
      );

      if (savedCalculation) {
        // Verify Skill
        await trackSkill(calculationType, { result_summary: results });

        setIsOpen(false);
        setName('');
        setFile(null);
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
      setFile(null);
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
          {currentJob && (
            <div className="bg-muted/50 p-3 rounded-md text-sm flex items-center gap-2 border border-muted">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Saving to: <strong className="font-medium text-foreground">{currentJob.name}</strong></span>
            </div>
          )}
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

          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Verification (Optional)
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="cursor-pointer file:text-primary hover:file:bg-primary/10"
            />
          </div>

          <div className="text-xs flex items-center gap-1.5 mt-1 border-t pt-2">
            <MapPin className={`h-3.5 w-3.5 ${location ? "text-green-500" : geoLoading ? "text-yellow-500 animate-pulse" : "text-muted-foreground"}`} />
            <span className="text-muted-foreground">
              {location ? "GPS Location Captured" : geoLoading ? "Acquiring Location..." : "Location Unavailable"}
            </span>
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
