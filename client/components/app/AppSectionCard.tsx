import React from "react";
import { cn } from "@/lib/utils";

interface AppSectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padded?: boolean;
}

export function AppSectionCard({
  children,
  className,
  padded = true,
  ...props
}: AppSectionCardProps) {
  return (
    <section
      className={cn(
        "app-surface app-elev-1",
        padded ? "p-5 sm:p-6" : "p-0",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
