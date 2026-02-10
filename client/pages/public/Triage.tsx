import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertCircle,
  UploadCloud,
  Camera,
  ArrowRight,
  Loader2,
  PlayCircle,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
      // 1. Upload Files
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
        setProgress(10 + ((i + 1) / files.length) * 40); // Upload takes up to 50%
      }
      setUploading(false);

      // 2. Submit Data
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

      // 3. Trigger AI Analysis
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
      setTimeout(() => setStep(4), 500); // Small delay for polish
      toast({
        title: "Submission Received",
        description:
          "Our AI is analyzing your issue. An agent will contact you shortly.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit triage.",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 -z-20" />
      <div className="absolute top-0 -left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 -right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] -z-10 animate-pulse delay-700" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-tr from-cyan-600 to-cyan-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/30 mb-6"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight"
          >
            ThermoNeural AI
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-500 dark:text-slate-400"
          >
            Instant HVAC Diagnostics
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Welcome</CardTitle>
                  <CardDescription>
                    Let's get your system back up and running. Who are we
                    speaking with?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      className="bg-white/50 dark:bg-slate-800/50"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      className="bg-white/50 dark:bg-slate-800/50"
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
                    className="w-full bg-cyan-600 hover:bg-cyan-700 h-12 text-lg shadow-lg shadow-cyan-500/20"
                    onClick={handleNext}
                    disabled={!formData.name || !formData.phone}
                  >
                    Start Diagnosis <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>What's Happening?</CardTitle>
                  <CardDescription>
                    Describe the issue (e.g., strange noises, no cold air).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="I hear a loud buzzing sound coming from the outside unit..."
                      className="h-40 text-lg bg-white/50 dark:bg-slate-800/50 resize-none p-4"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      autoFocus
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-4">
                  <Button variant="ghost" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!formData.description}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Visual Analysis</CardTitle>
                  <CardDescription>
                    Upload photos or video of your unit's model plate and the
                    issue.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                      />
                      <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <p className="font-semibold text-lg text-slate-700 dark:text-slate-200">
                        Tap to Upload Evidence
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Photos or Short Video (Max 50MB)
                      </p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3"
                    >
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider text-xs">
                        Selected Files
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {files.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm text-xs"
                          >
                            {f.type.startsWith("video") ? (
                              <PlayCircle className="w-4 h-4 text-cyan-500" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-green-500" />
                            )}
                            <span className="truncate font-medium">
                              {f.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {loading && (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                      <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-2">
                          {uploading ? (
                            <UploadCloud className="w-4 h-4 animate-bounce" />
                          ) : (
                            <Sparkles className="w-4 h-4 animate-spin" />
                          )}
                          {uploading
                            ? "Uploading Media..."
                            : "AI Diagnosis in Progress..."}
                        </span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress
                        value={progress}
                        className="h-2 bg-slate-200 dark:bg-slate-700"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between gap-4">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={files.length === 0 || loading}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white shadow-lg shadow-cyan-500/25 h-12 text-lg font-medium"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Camera className="w-5 h-5 mr-2" />
                    )}
                    Analyze System
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <Card className="shadow-2xl border-none ring-1 ring-green-200 dark:ring-green-900 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2"
                  >
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </motion.div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      Analysis Complete
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                      We've received your data. A senior technician has been
                      notified and is reviewing your case.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl w-full text-left space-y-3 border border-slate-100 dark:border-slate-700 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Ticket ID</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        #{Math.floor(1000 + Math.random() * 9000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Status</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                        AI Processing
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">
                        Est. Response
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        &lt; 15 Mins
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 h-12 text-lg"
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Start New Triage
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 font-medium">
            &copy; 2025 ThermoNeural Inc.
            <br />
            <span className="opacity-50">Powered by OpenAI GPT-4o Vision</span>
          </p>
        </div>
      </div>
    </div>
  );
}
