import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  Loader2,
  Lock,
  PlayCircle,
  Wrench,
} from "lucide-react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

const MAX_FREE_RUNS = 3;

const ROLE_OPTIONS = [
  { value: "homeowner", label: "Homeowner (plain language)" },
  { value: "technician", label: "Technician (industry terms)" },
  { value: "engineer", label: "Engineer (system-level)" },
];

interface DemoResult {
  summary: string | null;
  probable_causes: string[];
  steps: string[];
  urgency: string | null;
  note: string | null;
}

type DemoError =
  | { kind: "limit" }
  | { kind: "error"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

function UrgencyChip({ urgency }: { urgency: string | null }) {
  if (!urgency) return null;
  const normalized = urgency.toLowerCase();
  if (normalized.includes("urgent")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
        <AlertTriangle className="h-4 w-4" /> Urgent
      </span>
    );
  }
  if (normalized.includes("soon")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <Clock className="h-4 w-4" /> Soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      <CheckCircle2 className="h-4 w-4" /> Routine
    </span>
  );
}

export default function TryWindow() {
  const [symptom, setSymptom] = useState("");
  const [role, setRole] = useState("homeowner");
  const [equipment, setEquipment] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<DemoError | null>(null);
  const [runsLeft, setRunsLeft] = useState<number | null>(null);

  const canRun =
    runsLeft === null || runsLeft > 0 || runsLeft === MAX_FREE_RUNS;

  async function runDemo() {
    const trimmed = symptom.trim();
    if (trimmed.length < 10) {
      setError({
        kind: "error",
        message:
          "Describe the symptom in at least 10 characters so the demo has something to work with.",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    trackMarketingEvent("try_demo_run", { method: "window" });

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/try-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          symptom: trimmed,
          role,
          equipment: equipment.trim() || undefined,
        }),
      });

      if (response.status === 429) {
        setError({ kind: "limit" });
        setRunsLeft(0);
        trackMarketingEvent("try_demo_result", { action: "limit" });
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string; error?: string }
          | null;
        throw new Error(
          body?.message ?? body?.error ?? `Demo request failed (${response.status})`,
        );
      }

      const data = (await response.json()) as DemoResult & {
        runs_left?: number;
      };
      setResult({
        summary: data.summary ?? null,
        probable_causes: Array.isArray(data.probable_causes)
          ? data.probable_causes
          : [],
        steps: Array.isArray(data.steps) ? data.steps : [],
        urgency: data.urgency ?? null,
        note: data.note ?? null,
      });
      if (typeof data.runs_left === "number") {
        setRunsLeft(data.runs_left);
      }
      trackMarketingEvent("try_demo_result", { action: "ok" });
    } catch (err) {
      setError({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong running the demo. Please try again.",
      });
      trackMarketingEvent("try_demo_result", { action: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicPageShell brand="box">
      <SEO
        title="Try the AI Troubleshooter Free | ThermoNeural"
        description="Describe an HVAC symptom and get a free sample verdict from the AI troubleshooter — no signup required. 3 free demos per day per visitor."
      />

      <section className="mx-auto max-w-3xl px-6 py-16">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <FlaskConical className="h-4 w-4" /> Free demo — no signup
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Try the AI troubleshooter
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Describe what the equipment is doing and get a sample verdict —
            probable causes, first steps, and how urgent it is. This is a
            taste of the full diagnostic wizard inside The Box.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {MAX_FREE_RUNS} free demos per day per visitor.
          </p>
        </div>

        {/* Form */}
        <Card className="mt-10">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <label
                htmlFor="try-symptom"
                className="text-sm font-medium text-foreground"
              >
                What's the equipment doing?
              </label>
              <Textarea
                id="try-symptom"
                placeholder="e.g. The AC in the living room runs constantly but the air barely feels cool, and there's ice on the bigger copper line."
                value={symptom}
                onChange={(event) => setSymptom(event.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="try-role"
                  className="text-sm font-medium text-foreground"
                >
                  I am a…
                </label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="try-role" className="w-full">
                    <SelectValue placeholder="Choose your background" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="try-equipment"
                  className="text-sm font-medium text-foreground"
                >
                  Equipment{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input
                  id="try-equipment"
                  placeholder="e.g. 3-ton residential split, walk-in cooler…"
                  value={equipment}
                  onChange={(event) => setEquipment(event.target.value)}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={runDemo}
                disabled={loading || !canRun}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Run demo
                  </>
                )}
              </Button>
              {runsLeft !== null && runsLeft > 0 ? (
                <span className="text-sm text-muted-foreground">
                  {runsLeft} free {runsLeft === 1 ? "demo" : "demos"} left today
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Limit block (429) — honest, with the way in */}
        {error?.kind === "limit" ? (
          <Card className="mt-8 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-200">
                    You've used all 3 free demos for today.
                  </p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                    The full troubleshooter — measurements, photos, and the
                    complete diagnostic wizard — is inside The Box.
                  </p>
                </div>
              </div>
              <Button asChild className="ml-auto shrink-0">
                <Link to="/signup">
                  Get full access <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Generic error — honest red + retry */}
        {error?.kind === "error" ? (
          <Card className="mt-8 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="font-medium text-red-900 dark:text-red-200">
                The demo didn't run.
              </p>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                {error.message}
              </p>
              <Button
                variant="outline"
                onClick={runDemo}
                disabled={loading}
                className="mt-4"
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Result card */}
        {result ? (
          <Card className="mt-8">
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Sample verdict
                </h2>
                <UrgencyChip urgency={result.urgency} />
              </div>

              {result.summary ? (
                <p className="text-foreground">{result.summary}</p>
              ) : null}

              {result.probable_causes.length > 0 ? (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Wrench className="h-4 w-4" /> Top {result.probable_causes.length}{" "}
                    probable {result.probable_causes.length === 1 ? "cause" : "causes"}
                  </h3>
                  <ul className="space-y-2">
                    {result.probable_causes.map((cause, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.steps.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    First {result.steps.length}{" "}
                    {result.steps.length === 1 ? "step" : "steps"}
                  </h3>
                  <ol className="space-y-2">
                    {result.steps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-foreground"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {result.note ? (
                <p className="text-sm italic text-muted-foreground">
                  {result.note}
                </p>
              ) : null}

              {/* Honest CTA — what the demo leaves out */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
                <p className="font-medium text-foreground">
                  This is a sample, not the full diagnosis.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The full troubleshooter inside The Box takes measurements and
                  photos, walks a complete diagnostic wizard, and keeps an
                  audit-ready record.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/signup">
                    Get full access <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </PublicPageShell>
  );
}
