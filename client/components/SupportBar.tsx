import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from 'react-router-dom';

export function SupportBar() {
  const location = useLocation();
  const hideOn = ['/signin', '/signup'];
  if (hideOn.includes(location.pathname)) return null;

  return (
    <>
      {/* Desktop/tablet support bar - moved slightly away from content and lower z-index */}
      <div className="hidden md:flex fixed right-6 bottom-6 z-20">
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
      <div className="md:hidden fixed right-3 bottom-3 z-20">
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
