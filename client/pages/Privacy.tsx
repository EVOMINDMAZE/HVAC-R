import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export function Privacy() {
  return (
    <PublicPageShell mainClassName="pb-20 px-4">
      <SEO title="Privacy Policy" description="ThermoNeural privacy policy." />
      <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">
              Legal
            </p>
            <h1 className="text-4xl font-semibold mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-8 md:p-12 space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    1
                  </span>
                  Introduction
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ThermoNeural ("we," "us," "our," or "Company") is committed to
                  protecting your privacy. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when
                  you visit our website and use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    2
                  </span>
                  Information We Collect
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">
                      Personal Information
                    </h3>
                    <p className="mb-2">
                      We collect information you provide directly to us, such
                      as:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Email address</li>
                      <li>First and last name</li>
                      <li>Company affiliation</li>
                      <li>Phone number</li>
                      <li>Location information</li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">
                      Usage Information
                    </h3>
                    <p className="mb-2">
                      We automatically collect certain information about your
                      device and how you interact with our platform, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        Log data (IP address, browser type, pages visited)
                      </li>
                      <li>Device information</li>
                      <li>Calculation history and preferences</li>
                      <li>Usage patterns and analytics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    3
                  </span>
                  How We Use Your Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Respond to your inquiries and support requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Comply with legal obligations</li>
                  <li>Prevent fraud and enhance security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    4
                  </span>
                  Information Sharing
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  We do not sell, trade, or rent your personal information to
                  third parties. We may share your information with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Service providers who assist us in operating our website and
                    conducting our business
                  </li>
                  <li>Payment processors for billing purposes</li>
                  <li>Legal authorities when required by law</li>
                  <li>Third parties with your consent</li>
                </ul>
              </section>

              {/* ... Other sections follow similar pattern ... */}

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    5
                  </span>
                  Data Security
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures including TLS 1.3 encryption for data in transit, AES-256 encryption at rest, and strict access controls. All passwords are hashed with bcrypt, and OAuth tokens are encrypted using PostgreSQL pgcrypto. Our infrastructure is regularly audited and monitored for security vulnerabilities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    6
                  </span>
                  Cookies and Tracking
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use essential cookies for core functionality, analytics cookies to improve our services, and optional marketing cookies (only with your explicit consent). You can manage your cookie preferences via the consent banner that appears on your first visit. We do not use cross‑site tracking or third‑party advertising cookies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    7
                  </span>
                  Your Rights (GDPR/CCPA)
                </h2>
                <p className="text-muted-foreground mb-4">
                  Under the GDPR (EU/EEA) and CCPA (California), you have the following rights regarding your personal data:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Access</strong> – Request a copy of your personal data in a portable format</li>
                  <li><strong>Rectification</strong> – Update inaccurate or incomplete information</li>
                  <li><strong>Erasure</strong> – Request deletion of your data (right to be forgotten)</li>
                  <li><strong>Restriction</strong> – Limit processing of your data under certain conditions</li>
                  <li><strong>Objection</strong> – Opt‑out of processing for direct marketing</li>
                  <li><strong>Portability</strong> – Receive your data in a structured, machine‑readable format</li>
                  <li><strong>Withdraw consent</strong> – Revoke previously given consent at any time</li>
                </ul>
                <div className="mt-6 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <h3 className="font-semibold text-foreground mb-2">Exercising Your Rights</h3>
                  <p className="text-muted-foreground mb-3">
                    To submit a Data Subject Request (DSR), please email us at support@thermoneural.com with the subject line "Data Subject Request". We will respond within 30 days as required by law.
                  </p>
                  <a
                    href="mailto:support@thermoneural.com?subject=Data Subject Request"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                  >
                    Submit a Data Subject Request
                  </a>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    8
                  </span>
                  Data Retention
                </h2>
                <p className="text-muted-foreground mb-4">
                  We retain personal data only as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Typical retention periods are:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Account data</strong> – Retained while your account is active, deleted 90 days after termination</li>
                  <li><strong>Calculation history</strong> – Retained for 7 years for audit and compliance purposes</li>
                  <li><strong>Logs and analytics</strong> – Retained for 12 months, then anonymized</li>
                  <li><strong>Marketing communications</strong> – Removed immediately upon opt‑out</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    9
                  </span>
                  International Transfers
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your personal data may be transferred to and processed in countries outside the European Economic Area (EEA). We ensure such transfers are protected by appropriate safeguards, including Standard Contractual Clauses (SCCs) approved by the European Commission, and Privacy Shield certification for US‑based providers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    10
                  </span>
                  Children's Privacy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal data without parental consent, please contact us immediately, and we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    11
                  </span>
                  Changes to This Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. When we make changes, we will update the "Last updated" date at the top of this page and, where appropriate, notify you via email or through the platform. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                    12
                  </span>
                  Contact Us
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have questions about this Privacy Policy, our data practices, or wish to exercise your privacy rights, please contact our Data Protection Officer:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg inline-block">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:privacy@thermoneural.com"
                      className="text-primary hover:underline ml-1"
                    >
                      privacy@thermoneural.com
                    </a>
                  </p>
                  <p className="text-muted-foreground mt-2">
                    <strong>Postal Address:</strong> ThermoNeural Inc., 123 Innovation Drive, Suite 400, San Francisco, CA 94107, USA
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
    </PublicPageShell>
  );
}
