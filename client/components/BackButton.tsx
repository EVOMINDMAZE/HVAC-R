import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function BackButton({ fallback = "/dashboard", children }: { fallback?: string; children?: React.ReactNode }) {
  const navigate = useNavigate();

  const handle = () => {
    try {
      // Prefer SPA navigation
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallback);
      }
    } catch (e) {
      navigate(fallback);
    }
  };

  return (
    <Button variant="outline" onClick={handle} aria-label="Go back">
      {children ?? "← Back"}
    </Button>
  );
}
