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
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/30">
      <Header variant="landing" />

      <main className="flex-grow pt-24 pb-20 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-900/10 dark:to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-slate-500/10 rounded-full blur-[100px] pointer-events-none" />

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
              className="mb-6 border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 backdrop-blur-sm"
            >
              Get in Touch
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Let's Start a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-slate-600">
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
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8">
                  <CardTitle className="flex items-center text-xl">
                    <Send className="h-5 w-5 mr-3 text-orange-400" />
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
                            className="pl-10 bg-background/50 border-input focus:border-orange-500 focus:ring-orange-500 transition-all"
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
                            className="pl-10 bg-background/50 border-input focus:border-orange-500 focus:ring-orange-500 transition-all"
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
                            className="pl-10 bg-background/50 border-input focus:border-orange-500 focus:ring-orange-500 transition-all"
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
                          <SelectTrigger className="bg-background/50 border-input focus:border-orange-500 focus:ring-orange-500 transition-all">
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
                        className="bg-background/50 border-input focus:border-orange-500 focus:ring-orange-500 transition-all"
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
                        className="min-h-[150px] bg-background/50 border-input focus:border-orange-500 focus:ring-orange-500 transition-all resize-none"
                        placeholder="Please provide details about your inquiry..."
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 rounded-xl"
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
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="flex items-start group">
                    <div className="mt-1 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                      <Mail className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Technical Support
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        For account assistance & bugs.
                      </p>
                      <a
                        href="mailto:support@thermoneural.com"
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium hover:underline"
                      >
                        support@thermoneural.com
                      </a>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  <div className="flex items-start group">
                    <div className="mt-1 bg-slate-100 dark:bg-slate-900/30 p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        General Inquiries
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        For demos & enterprise sales.
                      </p>
                      <a
                        href="mailto:hello@thermoneural.com"
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium hover:underline"
                      >
                        hello@thermoneural.com
                      </a>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      Response Times
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Technical Support
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          &lt; 24 hrs
                        </span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Sales Inquiries
                        </span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
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
