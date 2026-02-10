import { LoadingSpinner } from "@/components/LoadingSpinner";

interface PageLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoading({ message, fullScreen = true }: PageLoadingProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-slate-600/20 rounded-full blur-xl" />
            <div className="relative">
              <LoadingSpinner size="lg" className="text-cyan-500" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-mono font-bold text-slate-200 tracking-tight">
              {message || "Loading Command Interface"}
            </h3>
            <p className="text-sm text-slate-400 font-mono">
              Initializing system modules...
            </p>
          </div>

          <div className="pt-4">
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-cyan-500 to-slate-600 animate-pulse rounded-full" />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
              <span>BOOT</span>
              <span>MODULES</span>
              <span>READY</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/50">
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-mono">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>ThermoNeural v2.1</span>
              <span className="text-slate-600">•</span>
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
        <p className="text-sm text-slate-400 font-mono">{message}</p>
      )}
    </div>
  );
}