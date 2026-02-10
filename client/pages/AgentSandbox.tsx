import React, { useEffect, useState } from "react";
import {
  calculateSuperheat,
  calculateSubcooling,
  calculateTargetSuperheat,
} from "@/lib/formula-oracle";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        🤖 AI Agent Performance Sandbox
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unit 3: The Agent Doctor */}
        <Card>
          <CardHeader>
            <CardTitle>🏥 The Agent Doctor (Health Check)</CardTitle>
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

        {/* Unit 2: Context Explorer */}
        <Card>
          <CardHeader>
            <CardTitle>🕵️ Context Explorer (State)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm font-mono">
            <p>Email: {user?.email || "Not Logged In"}</p>
            <p>Role: {role || "Guest"}</p>
            <p>Company ID: {companyId || "None"}</p>
          </CardContent>
        </Card>

        {/* Unit 4: Formula Oracle */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>🔮 Formula Oracle (Math Validation)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-bold">Superheat (R22)</h4>
                <p>Input: 76 psig, 55°F</p>
                <p className="text-xl font-mono text-primary">
                  Result: {testResults.superheat.superheat?.toFixed(2)}°F
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: ~10.45°F
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-bold">Subcooling (R22)</h4>
                <p>Input: 225 psig, 95°F</p>
                <p className="text-xl font-mono text-primary">
                  Result: {testResults.subcooling.subcooling?.toFixed(2)}°F
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: ~13.00°F
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-bold">Target Superheat</h4>
                <p>Input: 67°F WB, 95°F DB</p>
                <p className="text-xl font-mono text-primary">
                  Result: {testResults.targetSH.toFixed(2)}°F
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: 13.00°F
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-cyan-50 border border-cyan-200 rounded text-cyan-800 text-sm">
        💡 <strong>Agent Insight:</strong> This sandbox allows any future agent
        to verify that the app's "Core Logic" is healthy in less than 500ms of
        page load.
      </div>
    </div>
  );
};

export default AgentSandbox;
