import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
} from "lucide-react";
import { aiPatternsAPI } from "@/lib/ai-patterns";
import { useToast } from "@/hooks/use-toast";

interface TechnicianFeedbackProps {
  patternId?: string;
  troubleshootingSessionId?: string;
  diagnosis: string;
  recommendedActions: string[];
  symptoms: string[];
  equipmentModel?: string;
  onFeedbackSubmitted?: (feedback: any) => void;
  trigger?: React.ReactNode;
}

interface FeedbackData {
  helpful: boolean;
  correct_diagnosis: boolean;
  technician_rating: number;
  actual_outcome: "success" | "partial" | "failed";
  time_spent_minutes: number;
  additional_actions_taken: string[];
  notes: string;
  parts_used: string[];
  follow_up_required: boolean;
}

export function TechnicianFeedback({
  patternId,
  troubleshootingSessionId,
  diagnosis,
  recommendedActions,
  symptoms,
  equipmentModel,
  onFeedbackSubmitted,
  trigger,
}: TechnicianFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<Partial<FeedbackData>>({
    helpful: false,
    correct_diagnosis: false,
    technician_rating: 3,
    actual_outcome: "partial",
    time_spent_minutes: 30,
    additional_actions_taken: [],
    notes: "",
    parts_used: [],
    follow_up_required: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<{
    helpful?: boolean;
    correct?: boolean;
  }>({});
  const { toast } = useToast();

  const handleSubmitQuickFeedback = async (
    helpful: boolean,
    correct: boolean,
  ) => {
    if (!patternId) return;

    setQuickFeedback({ helpful, correct });
    setSubmitting(true);

    try {
      await aiPatternsAPI.updatePatternFeedback(patternId, {
        helpful,
        correct_diagnosis: correct,
        technician_rating: helpful && correct ? 5 : 2,
      });

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping improve our AI diagnostics!",
      });

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted({ helpful, correct_diagnosis: correct });
      }
    } catch (error) {
      toast({
        title: "Feedback Failed",
        description: "Could not submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDetailedFeedback = async () => {
    if (!patternId && !troubleshootingSessionId) return;

    setSubmitting(true);

    try {
      const feedbackData = {
        helpful: feedback.helpful || false,
        correct_diagnosis: feedback.correct_diagnosis || false,
        actual_outcome: feedback.actual_outcome || "partial",
        technician_rating: feedback.technician_rating || 3,
        additional_notes: feedback.notes,
        time_spent: feedback.time_spent_minutes,
      };

      // Submit pattern feedback if we have a pattern ID
      if (patternId) {
        await aiPatternsAPI.updatePatternFeedback(patternId, feedbackData);
      }

      // Create outcome pattern if we have enough data
      if (
        troubleshootingSessionId &&
        symptoms.length > 0 &&
        feedback.actual_outcome
      ) {
        await aiPatternsAPI.captureDiagnosticOutcome(
          troubleshootingSessionId,
          symptoms,
          diagnosis,
          feedback.actual_outcome,
          equipmentModel,
        );
      }

      toast({
        title: "Detailed Feedback Submitted",
        description:
          "Thank you! Your feedback helps improve our AI for everyone.",
      });

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackData);
      }

      setIsOpen(false);
      // Reset form
      setFeedback({
        helpful: false,
        correct_diagnosis: false,
        technician_rating: 3,
        actual_outcome: "partial",
        time_spent_minutes: 30,
        additional_actions_taken: [],
        notes: "",
        parts_used: [],
        follow_up_required: false,
      });
    } catch (error) {
      toast({
        title: "Feedback Failed",
        description: "Could not submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDefaultTrigger = () => (
    <Card className="border-dashed border-2 hover:border-solid transition-colors cursor-pointer">
      <CardContent className="p-4 text-center">
        <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">Share Your Feedback</p>
        <p className="text-xs text-muted-foreground">
          Help improve AI diagnostics
        </p>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Quick Feedback Buttons */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
        <div className="text-sm text-muted-foreground">
          Was this recommendation helpful?
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={quickFeedback.helpful ? "default" : "outline"}
            size="sm"
            onClick={() =>
              handleSubmitQuickFeedback(true, quickFeedback.correct ?? true)
            }
            disabled={submitting}
            className={quickFeedback.helpful ? "text-green-600" : ""}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Helpful
          </Button>
          <Button
            variant={quickFeedback.helpful === false ? "default" : "outline"}
            size="sm"
            onClick={() => handleSubmitQuickFeedback(false, false)}
            disabled={submitting}
            className={quickFeedback.helpful === false ? "text-red-600" : ""}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            Not Helpful
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detailed Technician Feedback</DialogTitle>
                <DialogDescription>
                  Share your experience to help improve our AI diagnostic system
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Diagnosis Context */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">
                    AI Recommendation Summary
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Diagnosis:</strong> {diagnosis}
                    </div>
                    <div>
                      <strong>Symptoms:</strong> {symptoms.join(", ")}
                    </div>
                    {equipmentModel && (
                      <div>
                        <strong>Equipment:</strong> {equipmentModel}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Assessment */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Was this helpful?</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={feedback.helpful ? "default" : "outline"}
                        onClick={() =>
                          setFeedback((prev) => ({ ...prev, helpful: true }))
                        }
                        className="flex-1"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={
                          feedback.helpful === false ? "default" : "outline"
                        }
                        onClick={() =>
                          setFeedback((prev) => ({ ...prev, helpful: false }))
                        }
                        className="flex-1"
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        No
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Was the diagnosis correct?</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          feedback.correct_diagnosis ? "default" : "outline"
                        }
                        onClick={() =>
                          setFeedback((prev) => ({
                            ...prev,
                            correct_diagnosis: true,
                          }))
                        }
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Correct
                      </Button>
                      <Button
                        type="button"
                        variant={
                          feedback.correct_diagnosis === false
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setFeedback((prev) => ({
                            ...prev,
                            correct_diagnosis: false,
                          }))
                        }
                        className="flex-1"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Incorrect
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="space-y-2">
                  <Label>Overall Rating</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className={`h-6 w-6 cursor-pointer transition-colors ${
                          (feedback.technician_rating || 0) >= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300 hover:text-yellow-200"
                        }`}
                        onClick={() =>
                          setFeedback((prev) => ({
                            ...prev,
                            technician_rating: rating,
                          }))
                        }
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {feedback.technician_rating || 0} / 5
                    </span>
                  </div>
                </div>

                {/* Actual Outcome */}
                <div className="space-y-2">
                  <Label>Actual Resolution Outcome</Label>
                  <Select
                    value={feedback.actual_outcome}
                    onValueChange={(value: "success" | "partial" | "failed") =>
                      setFeedback((prev) => ({
                        ...prev,
                        actual_outcome: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Success - Issue fully resolved
                        </div>
                      </SelectItem>
                      <SelectItem value="partial">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          Partial - Issue improved but not fully resolved
                        </div>
                      </SelectItem>
                      <SelectItem value="failed">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Failed - No improvement or issue worsened
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Spent */}
                <div className="space-y-2">
                  <Label>Time Spent on Troubleshooting</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={feedback.time_spent_minutes}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          time_spent_minutes: parseInt(e.target.value) || 30,
                        }))
                      }
                      className="flex-1 p-2 border rounded"
                    />
                    <span className="text-sm text-muted-foreground">
                      minutes
                    </span>
                  </div>
                </div>

                {/* Recommended Actions Effectiveness */}
                <div className="space-y-2">
                  <Label>Recommended Actions Taken</Label>
                  <div className="space-y-2">
                    {recommendedActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`action-${index}`}
                          checked={feedback.additional_actions_taken?.includes(
                            action,
                          )}
                          onChange={(e) => {
                            const actions =
                              feedback.additional_actions_taken || [];
                            if (e.target.checked) {
                              setFeedback((prev) => ({
                                ...prev,
                                additional_actions_taken: [...actions, action],
                              }));
                            } else {
                              setFeedback((prev) => ({
                                ...prev,
                                additional_actions_taken: actions.filter(
                                  (a) => a !== action,
                                ),
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`action-${index}`} className="text-sm">
                          {action}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="What worked well? What didn't? Any suggestions for improvement?"
                    value={feedback.notes}
                    onChange={(e) =>
                      setFeedback((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitDetailedFeedback}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-1 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Custom trigger or default card */}
      {trigger || getDefaultTrigger()}
    </>
  );
}
