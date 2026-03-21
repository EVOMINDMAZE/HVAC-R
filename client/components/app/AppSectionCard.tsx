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
        "rounded-xl border border-border/50 bg-card text-card-foreground",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.02)]",
        padded ? "p-5 sm:p-6 lg:p-7" : "p-0",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
