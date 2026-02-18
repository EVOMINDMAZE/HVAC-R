import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DevModeBannerProps {
  /** Whether development mode bypass is active */
  isActive: boolean;
  /** Callback to close/deactivate the banner */
  onClose?: () => void;
}

export function DevModeBanner({ isActive, onClose }: DevModeBannerProps) {
  if (!isActive || !import.meta.env.DEV) {
    return null;
  }

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleDisableBypass = () => {
    // Remove URL parameter by reloading without it
    const url = new URL(window.location.href);
    url.searchParams.delete('bypassAuth');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  };

  return (
    <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800 sticky top-0 z-50 rounded-none shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <AlertTitle className="text-purple-800 dark:text-purple-300 font-semibold">
              <span className="inline-flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Development Mode Active
              </span>
            </AlertTitle>
            <AlertDescription className="text-purple-700 dark:text-purple-400 mt-1">
              <p className="mb-2">
                Authentication is currently bypassed. You have full access to the application without valid credentials.
                <strong className="ml-1">This should only be used for development and testing.</strong>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">How this was activated:</p>
                  <ul className="text-xs space-y-1 list-disc list-inside text-purple-700 dark:text-purple-400">
                    <li>URL parameter: <code className="px-1 py-0.5 bg-purple-100 dark:bg-purple-900 rounded">?bypassAuth=1</code></li>
                    <li>Only works in development mode</li>
                  </ul>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">To disable:</p>
                  <ul className="text-xs space-y-1 list-disc list-inside text-purple-700 dark:text-purple-400">
                    <li>Remove <code>?bypassAuth=1</code> from URL and refresh</li>
                    <li>Use the button below</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableBypass}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
                >
                  Disable Development Mode
                </Button>
                <a
                  href="/signout"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 text-purple-600 hover:text-purple-800"
                >
                  Sign Out
                </a>
              </div>
            </AlertDescription>
          </div>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-purple-500 hover:text-purple-700 hover:bg-purple-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}