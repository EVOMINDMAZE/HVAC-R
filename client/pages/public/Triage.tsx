import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  UploadCloud,
  Camera,
  ArrowRight,
  Loader2,
  PlayCircle,
  ImageIcon,
  ClipboardCheck,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageContainer } from "@/components/PageContainer";

export default function Triage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [ticketId] = useState(() => Math.floor(1000 + Math.random() * 9000));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setProgress(10);
    try {
      const mediaUrls: string[] = [];
      setUploading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `submissions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("triage-uploads")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("triage-uploads").getPublicUrl(filePath);

        mediaUrls.push(publicUrl);
        setProgress(10 + ((i + 1) / files.length) * 40);
      }
      setUploading(false);

      setProgress(60);
      const { data: submissionData, error: dbError } = await supabase
        .from("triage_submissions")
        .insert({
          homeowner_name: formData.name,
          homeowner_phone: formData.phone,
          problem_description: formData.description,
          media_urls: mediaUrls,
          status: "new",
        })
        .select();

      if (dbError) throw dbError;
      if (!submissionData || submissionData.length === 0)
        throw new Error("Failed to retrieve submission ID.");

      setProgress(70);
      try {
        const { data: funcData, error: funcError } =
          await supabase.functions.invoke("analyze-triage-media", {
            body: { submission_id: submissionData[0].id },
          });

        if (funcError) {
          console.warn(
            "Edge Function failed (likely not deployed or missing keys). Falling back to mock.",
            funcError,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          console.log("AI Analysis Result:", funcData);
        }
      } catch (err) {
        console.warn("Edge Function invocation error:", err);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      setProgress(100);
      setTimeout(() => setStep(4), 500);
      toast({
        title: "Submission received",
        description:
          "Thanks for the details. An HVAC specialist is reviewing your request and will follow up shortly.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Submission error",
        description: error.message || "Failed to submit triage.",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const stepLabel = step <= 3 ? `Step ${step} of 3` : "Complete";

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />
      <main className="relative py-12 sm:py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_55%)]" />
        <PageContainer>
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Service Intake
              </span>
              <h1 className="text-3xl sm:text-4xl font-semibold">
                HVAC&R triage for refrigeration and cryogenic systems.
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Share symptoms, equipment details, and media so our specialists can
                prioritize the right response. Most requests are reviewed within
                one business day.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <span>{stepLabel}</span>
              <span>Average time: 3-5 minutes</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact information</CardTitle>
                      <CardDescription>
                        Let us know who to follow up with once the review is complete.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full name</Label>
                        <Input
                          placeholder="Jordan Lee"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone number</Label>
                        <Input
                          placeholder="(555) 123-4567"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full h-11"
                        onClick={handleNext}
                        disabled={!formData.name || !formData.phone}
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Describe the issue</CardTitle>
                      <CardDescription>
                        Include symptoms, recent maintenance, and any alarms or
                        readings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Example: The walk-in freezer struggles to hold -10 F and the compressor short cycles every 20 minutes."
                        className="min-h-[160px] resize-none"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        autoFocus
                      />
                    </CardContent>
                    <CardFooter className="flex justify-between gap-3">
                      <Button variant="outline" onClick={handleBack}>
                        Back
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={!formData.description}
                        className="flex-1"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload photos or video</CardTitle>
                      <CardDescription>
                        Share a model plate, control panel, or short video of the issue.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="relative rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                        />
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
                          <UploadCloud className="h-6 w-6 text-primary" />
                        </div>
                        <p className="font-medium">Upload supporting media</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Photos or short video clips, up to 50MB total.
                        </p>
                      </div>

                      {files.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Selected files
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {files.map((f, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs"
                              >
                                {f.type.startsWith("video") ? (
                                  <PlayCircle className="h-4 w-4 text-primary" />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-primary" />
                                )}
                                <span className="truncate font-medium">
                                  {f.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {loading && (
                        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              {uploading ? (
                                <UploadCloud className="h-4 w-4" />
                              ) : (
                                <ClipboardCheck className="h-4 w-4" />
                              )}
                              {uploading
                                ? "Uploading media..."
                                : "Preparing review summary..."}
                            </span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between gap-3">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={loading}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={files.length === 0 || loading}
                        className="flex-1"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        Submit for review
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="py-10 text-center space-y-6">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold">
                          Submission complete
                        </h2>
                        <p className="text-muted-foreground">
                          Your request is in queue. A specialist will review the
                          details and follow up by phone or email.
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 p-4 text-left text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Ticket ID</span>
                          <span className="font-mono font-semibold">#{ticketId}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-muted-foreground">Status</span>
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                            Under review
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-muted-foreground">Response time</span>
                          <span className="font-medium text-emerald-600">
                            Within 1 business day
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.location.reload()}
                      >
                        Start a new request
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
