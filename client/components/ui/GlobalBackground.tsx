import { BlueprintGrid } from "@/components/ui/BlueprintGrid";

export function GlobalBackground() {
  return (
    <>
      <BlueprintGrid opacity={0.04} className="text-primary fixed inset-0 z-[-1] pointer-events-none" />
      <div className="fixed inset-0 z-[-1] hidden sm:block pointer-events-none">
        <img
          src="/assets/landing/create_image_like_202603191616.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-[0.07] blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent to-transparent dark:from-[#0a0f1a] dark:via-transparent dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:to-[#0a0f1a]" />
      </div>
    </>
  );
}
