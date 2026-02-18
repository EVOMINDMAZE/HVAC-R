import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";

const STORAGE_KEY = "thermoneural-keyboard-shortcuts-enabled";
const FIRST_TIME_KEY = "thermoneural-shortcuts-first-time";

interface KeyboardShortcutsOptions {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
}

/**
 * Hook to manage keyboard shortcuts with user preferences
 */
export function useKeyboardShortcuts(): KeyboardShortcutsOptions {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [enabled, setEnabledState] = useState(() => {
    // Default to enabled, check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });
  const [showHelp, setShowHelp] = useState(false);
  const [firstTime, setFirstTime] = useState(() => {
    return localStorage.getItem(FIRST_TIME_KEY) !== "false";
  });

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    localStorage.setItem(STORAGE_KEY, value.toString());
    
    addToast({
      type: "info",
      title: value ? "Keyboard shortcuts enabled" : "Keyboard shortcuts disabled",
      description: value 
        ? "Press '?' to see available shortcuts" 
        : "You can re-enable them in settings",
      duration: 3000,
    });
  }, [addToast]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Don't trigger if shortcuts are disabled
    if (!enabled) return;

    // Don't trigger if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      // Allow Escape even in inputs
      if (e.key === "Escape") {
        // Close any open modals or menus
        const closeButtons = document.querySelectorAll('[data-close-modal], [aria-label="Close"]');
        if (closeButtons.length > 0) {
          (closeButtons[0] as HTMLElement).click();
        }
      }
      return;
    }

    switch (e.key) {
      case "?":
        e.preventDefault();
        setShowHelp(prev => !prev);
        break;
      case "/": {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder*="Search"]',
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          // Show toast on first use
          if (firstTime) {
            addToast({
              type: "info",
              title: "Pro tip: Keyboard shortcuts",
              description: "Press '?' anytime to see all available shortcuts",
              duration: 5000,
            });
            localStorage.setItem(FIRST_TIME_KEY, "false");
            setFirstTime(false);
          }
        }
        break;
      }
      case "p":
      case "P":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          navigate("/pricing");
        }
        break;
      case "f":
      case "F":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          navigate("/features");
        }
        break;
      case "h":
      case "H":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          navigate("/");
        }
        break;
      case "Escape":
        // Close modals, menus, or help
        if (showHelp) {
          setShowHelp(false);
        } else {
          // Try to close any open modal
          const closeButtons = document.querySelectorAll('[data-close-modal], [aria-label="Close"]');
          if (closeButtons.length > 0) {
            (closeButtons[0] as HTMLElement).click();
          }
        }
        break;
    }
  }, [enabled, firstTime, navigate, showHelp, addToast]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return {
    enabled,
    setEnabled,
    showHelp,
    setShowHelp,
  };
}

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
