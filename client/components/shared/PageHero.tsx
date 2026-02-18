import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeroProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
  children?: React.ReactNode;
}

export function PageHero({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  className,
  children,
}: PageHeroProps) {
  return (
    <div className={cn("page-hero", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="page-hero__breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="page-hero__breadcrumb-sep">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="page-hero__breadcrumb-link">
                  {crumb.label}
                </a>
              ) : (
                <span className="page-hero__breadcrumb">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="page-hero__header">
        <div className="page-hero__title-row">
          {icon && <div className="page-hero__icon">{icon}</div>}
          <div className="page-hero__title-group">
            <h1 className="page-hero__title">{title}</h1>
            {subtitle && <p className="page-hero__subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="page-hero__actions">{actions}</div>}
      </div>

      {children && <div className="page-hero__content">{children}</div>}
    </div>
  );
}