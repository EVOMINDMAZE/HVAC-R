import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Shield, Target, Users } from "lucide-react";
import { PublicPageShell } from "@/components/public/PublicPageShell";

const values = [
  {
    icon: Target,
    title: "Precision over noise",
    description:
      "We build tools that reduce ambiguity and help engineers deliver consistent results.",
  },
  {
    icon: Shield,
    title: "Responsible compliance",
    description:
      "Workflows map to real-world standards so reports are audit-ready from day one.",
  },
  {
    icon: Users,
    title: "Built for teams",
    description:
      "Collaboration, review, and traceability are designed into every workflow.",
  },
];

export function About() {
  return (
    <PublicPageShell>
      <SEO
        title="About"
        description="Learn about ThermoNeural's mission to modernize HVAC&R, refrigeration, and cryogenic engineering workflows."
      />

      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">About ThermoNeural</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold">
            Modern engineering software for HVAC&R, refrigeration, and cryogenics.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            ThermoNeural was built for engineers who need accurate calculations, consistent reporting,
            and reliable compliance workflows without the overhead of scattered spreadsheets and
            legacy tools.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 bg-secondary/30">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Our mission</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Deliver the most trusted HVAC&R and cryogenic analysis platform so engineering teams
              can move faster, stay compliant, and make confident decisions.
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Our vision</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              A future where every refrigeration system is optimized for performance, safety, and
              environmental impact—with documentation that stands up to any audit.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">What we believe</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <Card key={value.title} className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <value.icon className="h-5 w-5 text-primary" />
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {value.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-10">
          <h2 className="text-3xl font-semibold">Work with us</h2>
          <p className="mt-3 text-muted-foreground">
            We partner with contractors, industrial operators, and R&D teams to deliver workflows
            that match how real engineers work. Reach out to see how ThermoNeural can support
            your projects.
          </p>
          <div className="mt-6">
            <a href="/contact" className="text-primary underline">Contact our team</a>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
