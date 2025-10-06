import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function BackButton({ fallback = "/dashboard", children }: { fallback?: string; children?: React.ReactNode }) {
  const navigate = useNavigate();

  const handle = () => {
    // Use window.history.state to check if there's a previous page
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button variant="outline" onClick={handle} aria-label="Go back">
      {children ?? "← Back"}
    </Button>
  );
}
