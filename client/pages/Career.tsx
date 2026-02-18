import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import { PageContainer } from "@/components/PageContainer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Star,
  Loader2,
  Trophy,
  Clock,
  Hammer,
  CheckCircle,
  Shield,
} from "lucide-react";
import { format } from "date-fns";

interface SkillLog {
  id: string;
  skill_type: string;
  xp_value: number;
  verified_at: string;
  project_id?: string;
  projects?: {
    name: string;
  };
}

export default function Career() {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SkillLog[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    async function fetchParams() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data, error } = await supabase
        .from("skill_logs")
        .select(
          `
                    id, 
                    skill_type, 
                    xp_value, 
                    verified_at, 
                    project_id,
                    projects (
                        name
                    )
                `,
        )
        .eq("user_id", user.id)
        .order("verified_at", { ascending: false });

      if (error) {
        console.error("Error fetching skills", error);
      } else {
        const formattedLogs: SkillLog[] = (data || []).map((log: any) => ({
          ...log,
          projects: Array.isArray(log.projects)
            ? log.projects[0]
            : log.projects,
        }));
        setLogs(formattedLogs);
        const xp = formattedLogs.reduce(
          (acc, curr) => acc + (curr.xp_value || 0),
          0,
        );
        setTotalXP(xp);
      }
      setLoading(false);
    }

    fetchParams();
  }, [user]);

  const getLevel = (xp: number) => Math.floor(xp / 100) + 1;
  const getProgress = (xp: number) => xp % 100;
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16">
        <PageContainer>
          <div className="mx-auto max-w-xl">
            <Card>
              <CardHeader>
                <CardTitle>Sign in required</CardTitle>
                <CardDescription>
                  Access your skills logbook and professional profile by signing in.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/signup">Create account</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="py-10">
      <PageContainer>
        <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Career profile
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold">
                Skills and certifications
              </h1>
              <p className="text-muted-foreground">
                Track verified HVAC&R experience across projects and teams.
              </p>
            </div>

            <Card>
              <CardContent className="p-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {(displayName || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{displayName}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        HVAC&R professional profile
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Level {getLevel(totalXP)}</span>
                      <span>{getProgress(totalXP)} / 100 XP</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${getProgress(totalXP)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 text-amber-500" />
                      Total XP
                    </div>
                    <p className="text-2xl font-semibold mt-2">{totalXP}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4 text-emerald-500" />
                      Skills logged
                    </div>
                    <p className="text-2xl font-semibold mt-2">{logs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Hammer className="h-5 w-5 text-primary" />
                    Skills logbook
                  </h2>
                </div>

                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <Card>
                      <CardContent className="p-10 text-center space-y-3">
                        <Briefcase className="w-10 h-10 text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="font-semibold text-lg">
                            No skills verified yet
                          </h3>
                          <p className="text-muted-foreground">
                            Run calculations in the field tools to log verified
                            experience.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    logs.map((log) => (
                      <Card key={log.id}>
                        <CardContent className="p-4 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap justify-between items-start gap-2">
                              <h4 className="font-semibold text-foreground truncate">
                                {log.skill_type}
                              </h4>
                              <Badge variant="secondary">+{log.xp_value} XP</Badge>
                            </div>
                            {log.projects?.name && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                {log.projects.name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Clock className="w-3.5 h-3.5" />
                              Verified on{" "}
                              {format(
                                new Date(log.verified_at),
                                "MMM d, yyyy 'at' h:mm a",
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      Next milestones
                    </CardTitle>
                    <CardDescription>
                      Keep building verified experience for advanced roles.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">
                          Master technician
                        </span>
                        <span>Level 5</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[20%]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">
                          Winterization expert
                        </span>
                        <span>0/10 certs</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-primary/40 h-full w-[0%]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="rounded-xl bg-muted/40 p-4 border border-border">
                  <h4 className="font-semibold mb-2">Share your progress</h4>
                  <p className="text-sm text-muted-foreground">
                    Export verified skills to your resume or share with supervisors
                    to document field experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
    </div>
  );
}
