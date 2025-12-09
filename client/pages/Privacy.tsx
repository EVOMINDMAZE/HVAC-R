import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <Header variant="landing" />

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <main className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Legal</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
            <CardContent className="p-8 md:p-12 space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                  Introduction
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  ThermoNeural ("we," "us," "our," or "Company") is committed to
                  protecting your privacy. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when you
                  visit our website and use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                  Information We Collect
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">
                      Personal Information
                    </h3>
                    <p className="mb-2">
                      We collect information you provide directly to us, such as:
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
                      We automatically collect certain information about your device
                      and how you interact with our platform, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Log data (IP address, browser type, pages visited)</li>
                      <li>Device information</li>
                      <li>Calculation history and preferences</li>
                      <li>Usage patterns and analytics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">3</span>
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
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">4</span>
                  Information Sharing
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  We do not sell, trade, or rent your personal information to third
                  parties. We may share your information with:
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
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">5</span>
                  Data Security
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational measures to
                  protect your personal information against unauthorized access,
                  alteration, disclosure, or destruction. However, no method of
                  transmission over the internet is 100% secure, and we cannot
                  guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">6</span>
                  Cookies and Tracking
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your
                  experience. You can control cookie preferences through your
                  browser settings. Please note that disabling cookies may affect
                  the functionality of our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">7</span>
                  Your Rights
                </h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your location, you may have certain rights regarding
                  your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Right to access your personal information</li>
                  <li>Right to correct inaccurate data</li>
                  <li>Right to request deletion of your data</li>
                  <li>Right to opt-out of marketing communications</li>
                  <li>Right to data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">8</span>
                  Contact Us
                </h2>
                <p className="text-muted-foreground mb-4">
                  If you have questions about this Privacy Policy or our privacy
                  practices, please contact us:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg inline-block">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> <a href="mailto:support@thermoneural.com" className="text-primary hover:underline ml-1">support@thermoneural.com</a>
                  </p>
                </div>
              </section>

            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
