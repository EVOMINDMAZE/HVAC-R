import { ArrowUpRight, ShieldCheck } from "lucide-react";

/**
 * The ThermoNeural Guarantee strip — single-source copy from docs/GUARANTEE.md.
 * Ship verbatim in all four product footers.
 */
export function GuaranteeStrip({ href = "/terms#guarantee" }: { href?: string }) {
  return (
    <a
      href={href}
      className="group flex items-center justify-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3.5 mb-8 transition-colors hover:bg-primary/10"
    >
      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-sm text-foreground font-medium text-center">
        <span className="font-bold text-primary">The ThermoNeural Guarantee:</span>{" "}
        your data is yours — export everything, cancel anytime, 30-day money-back.
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </a>
  );
}
