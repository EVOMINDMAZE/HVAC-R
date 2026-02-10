import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Building2,
  User,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

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
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      <Header variant="landing" />

      <main className="flex-grow pt-24 pb-20 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <Badge
              variant="outline"
              className="mb-6 border-primary/30 bg-primary/10 text-primary dark:bg-primary/20 backdrop-blur-sm"
            >
              Get in Touch
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold font-mono tracking-tight mb-6">
              Let's Start a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
                Conversation
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have questions about our thermodynamic tools, need technical
              support, or want to discuss enterprise solutions? We're here to
              help.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="bg-card/50 backdrop-blur-md shadow-xl border-border overflow-hidden">
                <CardHeader className="bg-secondary text-foreground p-8">
                  <CardTitle className="flex items-center text-xl font-mono">
                    <Send className="h-5 w-5 mr-3 text-primary" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Full Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            placeholder="John Doe"
                            className="pl-10 bg-secondary/50 border-input focus:border-primary focus:ring-primary transition-all"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            className="pl-10 bg-secondary/50 border-input focus:border-primary focus:ring-primary transition-all"
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
                        <Label
                          htmlFor="company"
                          className="text-sm font-medium"
                        >
                          Company
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="company"
                            placeholder="Acme Inc."
                            className="pl-10 bg-secondary/50 border-input focus:border-primary focus:ring-primary transition-all"
                            value={formData.company}
                            onChange={(e) =>
                              handleInputChange("company", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="category"
                          className="text-sm font-medium"
                        >
                          Inquiry Type
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            handleInputChange("category", value)
                          }
                        >
                          <SelectTrigger className="bg-secondary/50 border-input focus:border-primary focus:ring-primary transition-all">
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">
                              Technical Support
                            </SelectItem>
                            <SelectItem value="sales">Sales Inquiry</SelectItem>
                            <SelectItem value="enterprise">
                              Enterprise Solutions
                            </SelectItem>
                            <SelectItem value="partnership">
                              Partnership
                            </SelectItem>
                            <SelectItem value="feedback">
                              Product Feedback
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        placeholder="How can we help?"
                        className="bg-secondary/50 border-input focus:border-primary focus:ring-primary transition-all"
                        value={formData.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) =>
                          handleInputChange("message", e.target.value)
                        }
                        className="min-h-[150px] bg-secondary/50 border-input focus:border-primary focus:ring-primary transition-all resize-none"
                        placeholder="Please provide details about your inquiry..."
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-medium text-foreground shadow-lg rounded-xl"
                    >
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <Card className="bg-card/50 backdrop-blur-md shadow-lg border-border h-fit">
                <CardHeader>
                  <CardTitle className="font-mono">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="flex items-start group">
                    <div className="mt-1 bg-secondary dark:bg-secondary/50 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold font-mono text-foreground mb-1">
                        Technical Support
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        For account assistance & bugs.
                      </p>
                      <a
                        href="mailto:support@thermoneural.com"
                        className="text-primary hover:text-primary/80 font-medium hover:underline"
                      >
                        support@thermoneural.com
                      </a>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  <div className="flex items-start group">
                    <div className="mt-1 bg-secondary dark:bg-secondary/50 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold font-mono text-foreground mb-1">
                        General Inquiries
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        For demos & enterprise sales.
                      </p>
                      <a
                        href="mailto:hello@thermoneural.com"
                        className="text-primary hover:text-primary/80 font-medium hover:underline"
                      >
                        hello@thermoneural.com
                      </a>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  <div className="bg-secondary/50 dark:bg-secondary/20 rounded-xl p-5 border border-border">
                    <h4 className="font-semibold font-mono mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      Response Times
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Technical Support
                        </span>
                        <span className="font-medium text-primary">
                          &lt; 24 hrs
                        </span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Sales Inquiries
                        </span>
                        <span className="font-medium text-primary">
                          &lt; 48 hrs
                        </span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
