import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title?: string;
  message: string;
  className?: string;
}

export function ErrorMessage({ title = "Error", message, className }: ErrorMessageProps) {
  return (
    <Alert className={cn("app-state-error", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
}
