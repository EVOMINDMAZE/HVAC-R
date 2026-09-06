import { BlueprintGrid } from "@/components/ui/BlueprintGrid";

// Global decorative background. The raster layer is a NON-CRITICAL visual
// accent — deliberately `loading="lazy"` + `decoding="async"` so it never
// competes with real content on first paint (it previously shipped a 2.2 MB
// image on EVERY page including mobile, where the layer is CSS-hidden but
// still downloaded). The JPEG below is the same artwork recompressed to
// ~1280px / 143 KB — visually identical at 7% opacity + 1px blur.
const BG_IMG = "/assets/landing/landing-bg.jpg";

export function GlobalBackground() {
  return (
    <>
      <BlueprintGrid opacity={0.04} className="text-primary fixed inset-0 z-[-1] pointer-events-none" />
      <div className="fixed inset-0 z-[-1] hidden sm:block pointer-events-none">
        <img
          src={BG_IMG}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-[0.07] blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent to-transparent dark:from-[#0a0f1a] dark:via-transparent dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:to-[#0a0f1a]" />
      </div>
    </>
  );
}
