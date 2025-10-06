import { Button } from "@/components/ui/button";
import { useLocation } from 'react-router-dom';

export function SupportBar() {
  const location = useLocation();
  const pathname = location.pathname;

  // Only show support actions on marketing / public pages.
  const showOnPrefixes = ['/', '/features', '/pricing', '/api-docs', '/about', '/contact'];
  const excludedPrefixes = ['/dashboard', '/standard-cycle', '/refrigerant-comparison', '/cascade-cycle', '/help-center', '/signin', '/signup', '/profile', '/settings'];

  const shouldShow = showOnPrefixes.some(p => pathname === p || pathname.startsWith(p + '/'))
    && !excludedPrefixes.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (!shouldShow) return null;

  return (
    <>
      {/* Desktop/tablet support bar */}
      <div className="hidden md:flex fixed right-8 bottom-6 z-20">
        <div className="flex flex-col items-end gap-2">
          <a href="/help-center" className="inline-flex">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              Help Center
            </Button>
          </a>
          <a href="mailto:support@simulateon.io" className="inline-flex">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              Contact Support
            </Button>
          </a>
          <a href="/pricing" className="inline-flex">
            <Button variant="ghost" size="sm">
              Upgrade
            </Button>
          </a>
        </div>
      </div>

      {/* Mobile compact help button */}
      <div className="md:hidden fixed right-3 bottom-3 z-30">
        <a href="/help-center" aria-label="Open Help Center">
          <button
            className="bg-white shadow rounded-full h-12 w-12 flex items-center justify-center text-sm"
            aria-haspopup="true"
          >
            ?
          </button>
        </a>
      </div>
    </>
  );
}
