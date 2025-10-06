import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

export function BackButton({ fallback = "/dashboard", children }: { fallback?: string; children?: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const attempted = useRef(false);

  const handle = () => {
    // Prevent repeated attempts
    if (attempted.current) return;
    attempted.current = true;

    const prevPath = window.location.pathname + window.location.search + window.location.hash;

    // Try history back first
    try {
      navigate(-1);
    } catch (e) {
      // ignore - we'll fallback below
    }

    // If browser didn't change location within 250ms, go to fallback
    setTimeout(() => {
      const current = window.location.pathname + window.location.search + window.location.hash;
      if (current === prevPath) {
        navigate(fallback);
      }
      attempted.current = false;
    }, 250);
  };

  return (
    <Button variant="outline" onClick={handle} aria-label="Go back">
      {children ?? "← Back"}
    </Button>
  );
}
