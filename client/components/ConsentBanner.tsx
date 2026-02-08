import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Cookie, X, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ConsentBannerProps {
  /** Whether the banner is visible */
  visible?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Callback when consent is granted */
  onConsentGranted?: () => void;
  /** Callback when consent is declined */
  onConsentDeclined?: () => void;
}

export function ConsentBanner({
  visible = true,
  onDismiss,
  onConsentGranted,
  onConsentDeclined,
}: ConsentBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!visible) {
    return null;
  }

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      // Record consent in backend if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch('/api/privacy/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            consent_type: 'essential_cookies',
            consent_version: 'v1.0',
            granted: true,
          }),
        });
      }

      // Store in localStorage as fallback
      localStorage.setItem('consent_essential_cookies_v1.0', 'true');
      localStorage.setItem('consent_given', 'true');
      localStorage.setItem('consent_timestamp', new Date().toISOString());

      onConsentGranted?.();
      onDismiss?.();
    } catch (error) {
      console.error('Failed to record consent:', error);
      // Still store locally
      localStorage.setItem('consent_essential_cookies_v1.0', 'true');
      localStorage.setItem('consent_given', 'true');
      localStorage.setItem('consent_timestamp', new Date().toISOString());
      onConsentGranted?.();
      onDismiss?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('consent_essential_cookies_v1.0', 'false');
    localStorage.setItem('consent_given', 'false');
    localStorage.setItem('consent_timestamp', new Date().toISOString());
    onConsentDeclined?.();
    onDismiss?.();
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-md z-50 rounded-lg shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold">
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Your Privacy Choices
              </span>
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400 mt-1">
              <p className="mb-3">
                We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. By continuing to use our platform, you consent to our use of essential cookies. You can manage your preferences at any time.
              </p>

              {showDetails && (
                <div className="space-y-3 mb-4 p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300">Essential Cookies</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Required for core functionality</p>
                    </div>
                    <div className="h-4 w-8 bg-blue-300 dark:bg-blue-700 rounded-full relative">
                      <div className="absolute top-0 left-0 h-4 w-4 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300">Analytics Cookies</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Help us improve our services</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300">Marketing Cookies</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Personalize ads and content</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? 'Saving...' : 'Accept All'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                >
                  Decline Non‑Essential
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCustomize}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Customize
                </Button>
                <Link
                  to="/privacy"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 text-blue-600 hover:text-blue-800"
                >
                  Privacy Policy
                </Link>
              </div>
            </AlertDescription>
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}

// Hook to check if consent has been given
export function useConsent() {
  const hasConsent = () => {
    if (typeof window === 'undefined') return false;
    const given = localStorage.getItem('consent_given');
    return given === 'true';
  };

  const getConsentVersion = (type: string, version: string) => {
    if (typeof window === 'undefined') return false;
    const key = `consent_${type}_${version}`;
    const value = localStorage.getItem(key);
    return value === 'true';
  };

  const recordConsent = async (type: string, version: string, granted: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`consent_${type}_${version}`, granted.toString());
    localStorage.setItem('consent_given', 'true');
    localStorage.setItem('consent_timestamp', new Date().toISOString());

    // Sync to backend if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        await fetch('/api/privacy/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            consent_type: type,
            consent_version: version,
            granted,
          }),
        });
      } catch (error) {
        console.error('Failed to sync consent to backend:', error);
      }
    }
  };

  return {
    hasConsent,
    getConsentVersion,
    recordConsent,
  };
}