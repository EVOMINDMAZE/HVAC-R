import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/useToast";

const STORAGE_KEY = "thermoneural-keyboard-shortcuts-enabled";
const FIRST_TIME_KEY = "thermoneural-shortcuts-first-time";

export interface KeyboardShortcutsOptions {
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
      case "/":
        {
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