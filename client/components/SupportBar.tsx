import React from 'react';
import { Button } from '@/components/ui/button';

export function SupportBar() {
  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div className="flex flex-col items-end gap-2">
        <a href="/help-center" className="inline-flex">
          <Button variant="secondary" size="sm" className="flex items-center gap-2">
            Help Center
          </Button>
        </a>
        <a href="mailto:support@simulateon.io" className="inline-flex">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            Contact Support
          </Button>
        </a>
        <a href="/pricing" className="inline-flex">
          <Button variant="ghost" size="sm">Upgrade</Button>
        </a>
      </div>
    </div>
  );
}
