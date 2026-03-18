import { LoadingSpinner } from "@/components/LoadingSpinner";

interface PageLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoading({ message, fullScreen = true }: PageLoadingProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/30">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-muted/20 rounded-full blur-xl" />
            <div className="relative">
              <LoadingSpinner size="lg" className="text-primary" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-mono font-bold text-foreground tracking-tight">
              {message || "Loading Command Interface"}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              Initializing system modules...
            </p>
          </div>

          <div className="pt-4">
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-primary to-muted animate-pulse rounded-full" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
              <span>BOOT</span>
              <span>MODULES</span>
              <span>READY</span>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>ThermoNeural v2.1</span>
              <span className="text-muted-foreground/70">•</span>
              <span>Military-Grade Interface</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-sm text-muted-foreground font-mono">{message}</p>
      )}
    </div>
  );
}