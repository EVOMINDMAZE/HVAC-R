import { Mail, Phone, MapPin, Clock, Send, Building2, User } from "lucide-react";
import { useState } from "react";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
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
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] text-primary pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Contact</p>
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-[56px] font-display font-extrabold tracking-tight text-white">
            Let's talk about your HVAC&R workflows.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Reach out for product questions, implementation guidance, or enterprise requirements.
            We respond within one business day.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="px-4 py-16 -mt-8 relative z-20">
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:-translate-y-1 transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-display">
                <Send className="h-5 w-5 text-primary" />
                Send a message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Jordan Smith"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="jordan@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        placeholder="Acme Refrigeration"
                        className="pl-10"
                        value={formData.company}
                        onChange={(e) =>
                          handleInputChange("company", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Inquiry Type</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                    >
                      <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Share a few details about your project or question."
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" className="w-full sm:w-auto">
                  Send message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:-translate-y-1 transition-all hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-display">Direct contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Support</p>
                    <p>support@thermoneural.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Sales</p>
                    <p>hello@thermoneural.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Phone</p>
                    <p>+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Headquarters</p>
                    <p>Boston, MA</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Response time</p>
                    <p>Within 1 business day</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
