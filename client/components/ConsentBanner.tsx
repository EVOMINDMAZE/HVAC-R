import { Cookie, X, Settings, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
      let user = null;
      if (supabase) {
        const { data: { user: fetchedUser } } = await supabase.auth.getUser();
        user = fetchedUser;
      }
      if (user && supabase) {
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
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center md:inset-x-auto md:right-4 md:bottom-4 md:max-w-sm">
      <Alert className="w-full border-border bg-card text-card-foreground rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[70dvh] flex flex-col overflow-hidden p-0">
        {/* Header row: icon + title + close on its own line so nothing overlaps */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-1">
          <AlertTitle className="text-foreground font-semibold flex items-center gap-2 min-w-0">
            <Cookie className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Your Privacy Choices
            </span>
          </AlertTitle>

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              aria-label="Close"
              className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Scrollable body so the banner never covers the full mobile viewport */}
        <AlertDescription className="text-muted-foreground px-5 pb-5 overflow-y-auto">
          <p className="mb-3">
            We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. By continuing to use our platform, you consent to our use of essential cookies. You can manage your preferences at any time.
          </p>

          {showDetails && (
            <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Essential Cookies</p>
                  <p className="text-sm text-muted-foreground">Required for core functionality</p>
                </div>
                <div className="h-4 w-8 bg-muted rounded-full relative">
                  <div className="absolute top-0 left-0 h-4 w-4 bg-primary rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Analytics Cookies</p>
                  <p className="text-sm text-muted-foreground">Help us improve our services</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  defaultChecked
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Marketing Cookies</p>
                  <p className="text-sm text-muted-foreground">Personalize ads and content</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? 'Saving...' : 'Accept All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="border-border text-foreground hover:bg-muted"
            >
              Decline Non‑Essential
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCustomize}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4 mr-1" />
              Customize
            </Button>
            <Link
              to="/privacy"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 text-foreground hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
