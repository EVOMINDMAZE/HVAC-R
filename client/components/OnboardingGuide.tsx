import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calculator, History, Layers, Sparkles, Zap } from "lucide-react";

const STORAGE_KEY = "simulateon:onboarding-complete";

const steps = [
  {
    title: "Run your first standard cycle",
    description:
      "Input refrigerant, boundary temps, and fine-tune superheat/subcooling. Real-time validation keeps entries in safe engineering ranges.",
    icon: Calculator,
  },
  {
    title: "Compare refrigerants side-by-side",
    description:
      "Evaluate multiple refrigerants at once, highlight COP and work input, and spot limitations instantly.",
    icon: Layers,
  },
  {
    title: "Dive into saved history",
    description:
      "Access every calculation from the History view, review details, and rerun scenarios with a click.",
    icon: History,
  },
  {
    title: "Unlock pro exports and collaboration",
    description:
      "Upgrade when you're ready to export reports, share with teammates, and remove usage limits.",
    icon: Zap,
  },
];

interface OnboardingGuideProps {
  userName?: string;
  className?: string;
}

export function OnboardingGuide({ userName, className }: OnboardingGuideProps) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasSeenGuide = localStorage.getItem(STORAGE_KEY) === "true";
    if (!hasSeenGuide) {
      setOpen(true);
    }
  }, []);

  const progressValue = useMemo(
    () => Math.round(((activeStep + 1) / steps.length) * 100),
    [activeStep],
  );

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setOpen(false);
    setActiveStep(0);
  };

  const currentStep = steps[activeStep];
  const StepIcon = currentStep.icon;

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        Quick Guide
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : handleClose())}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold">
              Welcome to Simulateon{userName ? `, ${userName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Follow these quick steps to run calculations and get the most out
              of your dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>
                  Step {activeStep + 1} of {steps.length}
                </span>
                <Badge variant="secondary" className="uppercase tracking-wide">
                  {progressValue}% complete
                </Badge>
              </div>
              <Progress
                value={progressValue}
                aria-label="Onboarding progress"
              />
            </div>

            <div className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4">
              <StepIcon className="mt-1 h-6 w-6 text-primary" aria-hidden />
              <div>
                <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentStep.description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-lg bg-muted/20 p-4 text-sm">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={cn(
                    "flex items-start gap-3 rounded-md p-3 transition-all",
                    index === activeStep
                      ? "bg-background shadow-sm"
                      : "opacity-80",
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
                disabled={activeStep === 0}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                >
                  Skip
                </Button>
                {activeStep === steps.length - 1 ? (
                  <Button type="button" onClick={handleClose}>
                    Got it
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() =>
                      setActiveStep((prev) =>
                        Math.min(prev + 1, steps.length - 1),
                      )
                    }
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
