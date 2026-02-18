import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export function TermsOfService() {
  return (
    <PublicPageShell mainClassName="pb-20 px-4">
      <SEO title="Terms of Service" description="ThermoNeural terms of service." />
      <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">
              Legal
            </p>
            <h1 className="text-4xl font-semibold mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-8 md:p-12 space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    1
                  </span>
                  Agreement to Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using the ThermoNeural website and services
                  ("Services"), you accept and agree to be bound by the terms
                  and provision of this agreement. If you do not agree to abide
                  by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    2
                  </span>
                  Use License
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Permission is granted to temporarily download one copy of the
                  materials (information or software) on ThermoNeural's website
                  for personal, non-commercial transitory viewing only. This is
                  the grant of a license, not a transfer of title, and under
                  this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Modify or copy the materials</li>
                  <li>
                    Use the materials for any commercial purpose or for any
                    public display
                  </li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>
                    Transfer the materials to another person or "mirror" the
                    materials on any other server
                  </li>
                  <li>
                    Attempt to gain unauthorized access to any portion of the
                    Services
                  </li>
                  <li>
                    Harass or cause distress or inconvenience to any person
                  </li>
                  <li>Transmit obscene or offensive content</li>
                  <li>
                    Disrupt the normal flow of dialogue within our website
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    3
                  </span>
                  Disclaimer
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  The materials on ThermoNeural's website are provided on an
                  "as-is" basis. ThermoNeural makes no warranties, expressed or
                  implied, and hereby disclaims and negates all other warranties
                  including, without limitation, implied warranties or
                  conditions of merchantability, fitness for a particular
                  purpose, or non-infringement of intellectual property or other
                  violation of rights.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  While we strive to provide accurate refrigeration
                  calculations, ThermoNeural does not warrant the accuracy or
                  completeness of the calculations or recommendations provided.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    4
                  </span>
                  Limitations
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  In no event shall ThermoNeural or its suppliers be liable for
                  damages (including, without limitation, damages for loss of
                  data or profit, or due to business interruption) arising out
                  of the use or inability to use the materials on ThermoNeural's
                  website, even if ThermoNeural or an authorized representative
                  has been notified orally or in writing of the possibility of
                  such damage.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    5
                  </span>
                  Accuracy of Materials
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  The materials appearing on ThermoNeural's website could
                  include technical, typographical, or photographic errors.
                  ThermoNeural does not warrant that any of the materials on its
                  website are accurate, complete, or current. ThermoNeural may
                  make changes to the materials contained on its website at any
                  time without notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    6
                  </span>
                  Links
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ThermoNeural has not reviewed all of the sites linked to its
                  website and is not responsible for the contents of any such
                  linked site. The inclusion of any link does not imply
                  endorsement by ThermoNeural of the site. Use of any such
                  linked website is at the user's own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    7
                  </span>
                  Modifications
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ThermoNeural may revise these terms of service for its website
                  at any time without notice. By using this website, you are
                  agreeing to be bound by the then current version of these
                  terms of service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    8
                  </span>
                  Governing Law
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  These terms and conditions are governed by and construed in
                  accordance with the laws of the United States and the State of
                  California, and you irrevocably submit to the exclusive
                  jurisdiction of the courts in that location.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    9
                  </span>
                  Contact Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg inline-block">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:support@thermoneural.com"
                      className="text-primary hover:underline ml-1"
                    >
                      support@thermoneural.com
                    </a>
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>
      </div>
    </PublicPageShell>
  );
}
