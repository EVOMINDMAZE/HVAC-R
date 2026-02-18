import React from "react";
import { cn } from "@/lib/utils";

export interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: "standard" | "wide" | "full";
}

export function PageLayout({
  children,
  className,
  variant = "standard",
}: PageLayoutProps) {
  return (
    <div className={cn("page-layout", `page-layout--${variant}`, className)}>
      {children}
    </div>
  );
}

export interface PageSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageSection({
  children,
  title,
  description,
  action,
  className,
}: PageSectionProps) {
  return (
    <section className={cn("page-section", className)}>
      {(title || action) && (
        <div className="page-section__header">
          <div className="page-section__title-group">
            {title && <h2 className="page-section__title">{title}</h2>}
            {description && <p className="page-section__description">{description}</p>}
          </div>
          {action && <div className="page-section__action">{action}</div>}
        </div>
      )}
      <div className="page-section__content">{children}</div>
    </section>
  );
}