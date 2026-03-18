import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

/**
 * Component to display keyboard shortcuts help panel
 */
export function KeyboardShortcutsHelp({ 
  show, 
  onClose,
  enabled,
  onToggle,
}: { 
  show: boolean; 
  onClose: () => void;
  enabled: boolean;
  onToggle: () => void;
}) {
  if (!show) return null;

  const shortcuts = [
    { key: "/", action: "Focus search", description: "Jump to search field" },
    { key: "p", action: "Go to Pricing", description: "Navigate to pricing page" },
    { key: "f", action: "Go to Features", description: "Navigate to features page" },
    { key: "h", action: "Go Home", description: "Return to homepage" },
    { key: "?", action: "Toggle help", description: "Show/hide this panel" },
    { key: "Esc", action: "Close", description: "Close modals or this panel" },
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg z-50 max-w-xs animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M6 12h.01M6 16h.01M10 8h8M10 12h8M10 16h8" />
          </svg>
          Keyboard Shortcuts
        </h4>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{shortcut.action}</span>
            <kbd className="px-2 py-0.5 bg-secondary rounded text-xs font-mono border border-border">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            className="rounded border-border"
          />
          <span className="text-muted-foreground">Enable shortcuts</span>
        </label>
      </div>
    </div>
  );
}

/**
 * Settings component for keyboard shortcuts
 */
export function KeyboardShortcutsSettings() {
  const { enabled, setEnabled } = useKeyboardShortcuts();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Keyboard Shortcuts</h3>
          <p className="text-sm text-muted-foreground">
            Navigate quickly using keyboard commands
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {enabled && (
        <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-2">Available shortcuts:</p>
          <ul className="space-y-1">
            <li><kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono border">/</kbd> - Focus search</li>
            <li><kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono border">p</kbd> - Go to Pricing</li>
            <li><kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono border">f</kbd> - Go to Features</li>
            <li><kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono border">h</kbd> - Go Home</li>
            <li><kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono border">?</kbd> - Show/hide help</li>
            <li><kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono border">Esc</kbd> - Close modals</li>
          </ul>
        </div>
      )}
    </div>
  );
}
