import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ErrorModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setTitle(detail.title || "Error");
      setMessage(detail.message || detail.error || "An unexpected error occurred.");
      setUpgradeRequired(!!detail.upgradeRequired);
      setOpen(true);
    };

    window.addEventListener("app:error", handler as EventListener);
    return () => window.removeEventListener("app:error", handler as EventListener);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {upgradeRequired && (
            <div className="p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
              This action requires an upgraded plan. Click Upgrade to view options.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant={upgradeRequired ? "default" : "outline"}
            onClick={() => {
              if (upgradeRequired) {
                // Open pricing in new tab
                window.open("/pricing", "_blank");
              } else {
                // simply close
                setOpen(false);
              }
            }}
          >
            {upgradeRequired ? "View Pricing" : "Close"}
          </Button>

          {!upgradeRequired && (
            <Button
              variant="ghost"
              onClick={() => {
                // allow user to report — open mailto with prefilled subject
                const subject = encodeURIComponent(`${title} - Report`);
                const body = encodeURIComponent(`Error details:\n\n${message}`);
                window.location.href = `mailto:support@simulateon.io?subject=${subject}&body=${body}`;
              }}
            >
              Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
