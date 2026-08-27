import { Mail, Phone, MapPin, Clock, Send, Building2, User } from "lucide-react";
import { useState } from "react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SEO } from "@/components/SEO";
import { BlueprintGrid } from "@/components/ui/BlueprintGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { MeasurementLabel } from "@/components/ui/MeasurementLabel";
import { SectionNumber } from "@/components/ui/SectionNumber";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    category: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<null | "success" | "error">(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("https://formsubmit.co/evomindmaze@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `[ThermoNeural ${formData.category || "General"}] ${formData.subject || "Contact request"}`,
          _template: "table",
          _captcha: "false",
          name: formData.name,
          email: formData.email,
          company: formData.company || "—",
          message: formData.message,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", company: "", subject: "", category: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <PublicPageShell mainClassName="pb-20">
      <SEO
        title="Contact"
        description="Contact ThermoNeural for HVAC&R, refrigeration, and cryogenic engineering support."
      />

      {/* Hero Section */}
      <section className="relative bg-slate-900 dark:bg-[#111827] pt-20 sm:pt-28 pb-16 sm:pb-20 lg:pt-40 lg:pb-32 overflow-hidden hero-gradient">
        <BlueprintGrid opacity={0.05} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionNumber number="01" className="absolute top-20 right-8 lg:right-16" />
          <div className="max-w-3xl">
            <MeasurementLabel className="text-primary mb-4">Contact</MeasurementLabel>
            <h1 className="mt-4 text-4xl md:text-5xl lg:text-[56px] font-display font-extrabold tracking-tight text-white leading-[1.1]">
              Let's talk about your HVAC&R workflows.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Reach out for product questions, implementation guidance, or enterprise requirements.
              We respond within one business day.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="px-4 py-16 lg:py-20 -mt-8 relative z-20">
        <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16">
          <Card className="bg-card/50 backdrop-blur-sm border-border/60 shadow-lg">
            <CardHeader className="pb-8">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-display">Send a message</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <MeasurementLabel>Full Name</MeasurementLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Jordan Smith"
                        className="pl-10 h-12"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <MeasurementLabel>Email Address</MeasurementLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="jordan@example.com"
                        className="pl-10 h-12"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <MeasurementLabel>Company</MeasurementLabel>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        placeholder="Acme Refrigeration"
                        className="pl-10 h-12"
                        value={formData.company}
                        onChange={(e) =>
                          handleInputChange("company", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <MeasurementLabel>Inquiry Type</MeasurementLabel>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="sales">Sales Inquiry</SelectItem>
                        <SelectItem value="enterprise">Enterprise Solutions</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="feedback">Product Feedback</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <MeasurementLabel>Subject</MeasurementLabel>
                  <Input
                    id="subject"
                    placeholder="How can we help?"
                    className="h-12"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-3">
                  <MeasurementLabel>Message</MeasurementLabel>
                  <Textarea
                    id="message"
                    placeholder="Share a few details about your project or question."
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full sm:w-auto px-8">
                  {submitting ? "Sending…" : "Send message"}
                </Button>
                {status === "success" && (
                  <p className="text-sm text-emerald-500">Thanks — we'll be in touch within one business day.</p>
                )}
                {status === "error" && (
                  <p className="text-sm text-red-500">Something went wrong. Please email us directly.</p>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8 lg:pt-24">
            <SectionNumber number="02" standalone className="relative" />

            <GlassCard variant="default" className="bg-card/40 backdrop-blur-sm">
              <GlassCardHeader className="pb-6">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <GlassCardTitle className="text-lg">Direct contact</GlassCardTitle>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6 text-sm">
                <div className="space-y-1">
                  <MeasurementLabel className="text-primary">Support</MeasurementLabel>
                  <div className="flex items-start gap-3 pt-2">
                    <Mail className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-foreground">support@thermoneural.com</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <MeasurementLabel className="text-primary">Sales</MeasurementLabel>
                  <div className="flex items-start gap-3 pt-2">
                    <Mail className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-foreground">hello@thermoneural.com</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <MeasurementLabel className="text-primary">Phone</MeasurementLabel>
                  <div className="flex items-start gap-3 pt-2">
                    <Phone className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <MeasurementLabel className="text-primary">Headquarters</MeasurementLabel>
                  <div className="flex items-start gap-3 pt-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-foreground">Boston, MA</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <MeasurementLabel className="text-primary">Response Time</MeasurementLabel>
                  <div className="flex items-start gap-3 pt-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-foreground">Within 1 business day</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}