import { useEffect, useState } from "react";
import {
  calculateSuperheat,
  calculateSubcooling,
  calculateTargetSuperheat,
} from "@/lib/formula-oracle";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicPageShell } from "@/components/public/PublicPageShell";

const AgentSandbox = () => {
  const { user, role, companyId } = useSupabaseAuth();
  const [healthStatus, setHealthStatus] = useState<any>({
    env: "Loading...",
    db: "Loading...",
  });

  useEffect(() => {
    // Simulating "The Agent Doctor" check in UI
    const checkHealth = async () => {
      const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasAnon = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

      setHealthStatus({
        env: hasUrl && hasAnon ? "Healthy" : "Misconfigured",
        db: user ? "Connected" : "Offline/Not Authenticated",
      });
    };
    checkHealth();
  }, [user]);

  // Test Formula Oracle
  const testResults = {
    superheat: calculateSuperheat("R22", 76, 55), // SatTemp for R22 @ 76psig is ~45F. Expected SH ~10F
    subcooling: calculateSubcooling("R22", 225, 95), // SatTemp for R22 @ 225psig is ~108F. Expected SC ~13F
    targetSH: calculateTargetSuperheat(67, 95), // ((3*67)-80-95)/2 = (201-80-95)/2 = 26/2 = 13F
  };

  return (
    <PublicPageShell withFooter={false} mainClassName="py-10">
      <div className="mx-auto max-w-4xl space-y-6 px-4">
        <h1 className="mb-6 text-3xl font-bold">
          AI Agent Performance Sandbox
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>The Agent Doctor (Health Check)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Environment:</span>
                <Badge
                  variant={
                    healthStatus.env === "Healthy" ? "default" : "destructive"
                  }
                >
                  {healthStatus.env}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>DB Connection:</span>
                <Badge
                  variant={
                    healthStatus.db === "Connected" ? "secondary" : "outline"
                  }
                >
                  {healthStatus.db}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Context Explorer (State)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm font-mono">
              <p>Email: {user?.email || "Not Logged In"}</p>
              <p>Role: {role || "Guest"}</p>
              <p>Company ID: {companyId || "None"}</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Formula Oracle (Math Validation)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-bold">Superheat (R22)</h4>
                  <p className="text-sm text-muted-foreground">Input: 76 psig, 55F</p>
                  <p className="mt-2 text-xl font-mono text-primary">
                    Result: {testResults.superheat.superheat?.toFixed(2)}F
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expected: ~10.45F
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-bold">Subcooling (R22)</h4>
                  <p className="text-sm text-muted-foreground">Input: 225 psig, 95F</p>
                  <p className="mt-2 text-xl font-mono text-primary">
                    Result: {testResults.subcooling.subcooling?.toFixed(2)}F
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expected: ~13.00F
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-bold">Target Superheat</h4>
                  <p className="text-sm text-muted-foreground">Input: 67F WB, 95F DB</p>
                  <p className="mt-2 text-xl font-mono text-primary">
                    Result: {testResults.targetSH.toFixed(2)}F
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expected: 13.00F
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <strong>Agent Insight:</strong> This sandbox verifies core logic health with a fast page load.
        </div>
      </div>
    </PublicPageShell>
  );
};

export default AgentSandbox;
