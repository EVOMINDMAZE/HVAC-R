import { useState, useEffect } from "react";
import { diagnose, Diagnosis } from "@/lib/diagnosis";
import { supabase } from "@/lib/supabase";

// The Box — physics-bridge diagnosis tool (Epic #4, P2–P4).
// Runs the deterministic refrigeration diagnostic engine (real saturation math)
// directly in the browser (no secrets, so an API proxy would only add a round-trip).
// Pro-gated at the ROUTE by SubscriptionGuard. Records a diagnosis onto a shared
// bridge asset (the same one PhasePoint/Cryovo reference). Honest disclaimer.

type Asset = { id: string; name: string; refrigerant?: string };

export function Diagnose() {
  const [input, setInput] = useState({
    refrigerant: "R410A",
    suction_pressure_psig: "",
    discharge_pressure_psig: "",
    suction_temp_f: "",
    liquid_line_temp_f: "",
    ambient_f: "",
  });
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [saved, setSaved] = useState(false);

  // Load the caller's shared bridge assets so a diagnosis can be recorded to one.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("equipment").select("id, name, refrigerant").eq("owner_id", user.id);
      if (data?.length) { setAssets(data as Asset[]); setAssetId(data[0].id); }
    })();
  }, []);

  const set = (k: keyof typeof input) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInput((s) => ({ ...s, [k]: e.target.value }));

  const run = () => {
    setResult(diagnose({
      refrigerant: input.refrigerant,
      suction_pressure_psig: input.suction_pressure_psig ? Number(input.suction_pressure_psig) : undefined,
      discharge_pressure_psig: input.discharge_pressure_psig ? Number(input.discharge_pressure_psig) : undefined,
      suction_temp_f: input.suction_temp_f ? Number(input.suction_temp_f) : undefined,
      liquid_line_temp_f: input.liquid_line_temp_f ? Number(input.liquid_line_temp_f) : undefined,
      ambient_f: input.ambient_f ? Number(input.ambient_f) : undefined,
    }));
    setSaved(false);
  };

  const record = async () => {
    if (!result || !assetId || result.fault === "insufficient_data") return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("equipment").update({
      last_diagnosis: {
        fault: result.fault, severity: result.severity, refrigerant: input.refrigerant,
        diagnosed_at: new Date().toISOString(), recommended_action: result.recommended_action,
        metrics: result.metrics,
      },
    }).eq("id", assetId).eq("owner_id", user.id);
    setSaved(!error);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl font-bold">Refrigerant diagnosis</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter field pressures and temperatures. The engine computes real saturation temperatures and
        classifies the charge / metering fault. <strong className="text-foreground">Pro feature.</strong>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Refrigerant</span>
          <select value={input.refrigerant} onChange={set("refrigerant")} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
            {["R410A","R134a","R32","R404A","R407C","R507A","R22","R290","R1234yf"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Ambient (°F)</span>
          <input value={input.ambient_f} onChange={set("ambient_f")} placeholder="optional" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Suction pressure (psig)</span>
          <input value={input.suction_pressure_psig} onChange={set("suction_pressure_psig")} placeholder="e.g. 118" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Discharge pressure (psig)</span>
          <input value={input.discharge_pressure_psig} onChange={set("discharge_pressure_psig")} placeholder="e.g. 260" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Suction temp (°F)</span>
          <input value={input.suction_temp_f} onChange={set("suction_temp_f")} placeholder="e.g. 49" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Liquid-line temp (°F)</span>
          <input value={input.liquid_line_temp_f} onChange={set("liquid_line_temp_f")} placeholder="e.g. 77" className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </label>
      </div>

      {assets.length > 0 && (
        <div className="mt-6">
          <span className="text-xs font-semibold text-muted-foreground">Record to asset</span>
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="mt-1 ml-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={record} disabled={!result || result.fault === "insufficient_data" || !assetId} className="ml-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-40">
            {saved ? "✓ Recorded" : "Record diagnosis"}
          </button>
        </div>
      )}

      <button onClick={run} className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Run diagnosis
      </button>

      {result && (
        <div className="mt-8">
          <div className={`rounded-2xl border p-5 ${result.fault === "normal" ? "border-emerald-500/40 bg-emerald-500/10" : result.fault === "insufficient_data" ? "border-warning/40 bg-warning/10" : "border-border bg-card/40"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wide">{result.fault.replace(/_/g, " ")}</span>
              {result.severity === "ok" && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs">OK</span>}
              {result.severity === "watch" && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs">Watch</span>}
              {result.severity === "critical" && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs">Critical</span>}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{result.recommended_action}</p>
            <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
              {result.evidence.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Physics-based diagnosis from real saturation math — not a guarantee. Verify on site before
            acting. The operator remains responsible for the final determination.
          </p>
        </div>
      )}
    </div>
  );
}
