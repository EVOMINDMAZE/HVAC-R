import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Brain,
  Clock,
  CheckCircle,
  Lightbulb,
  History,
  ThumbsUp,
  ThumbsDown,
  Star,
  ChevronRight,
  Target,
  BarChart3,
} from "lucide-react";
import {
  PatternRecommendation,
  EnhancedTroubleshootResponse,
  aiPatternsAPI,
} from "@/lib/ai-patterns";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedTroubleshootingProps {
  symptoms: string[];
  measurements?: Record<string, number>;
  equipmentModel?: string;
  companyId: string;
  ambientConditions?: {
    temperature: number;
    humidity?: number;
  };
  onRecommendationSelect?: (recommendation: PatternRecommendation) => void;
  onFeedbackSubmit?: (patternId: string, feedback: any) => void;
}

interface PatternFeedback {
  patternId: string;
  helpful: boolean;
  correct_diagnosis: boolean;
  additional_notes?: string;
  technician_rating?: number;
}

export function EnhancedTroubleshooting({
  symptoms,
  measurements,
  equipmentModel,
  companyId,
  ambientConditions,
  onRecommendationSelect,
  onFeedbackSubmit,
}: EnhancedTroubleshootingProps) {
  const [patternData, setPatternData] =
    useState<EnhancedTroubleshootResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, PatternFeedback>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (symptoms.length > 0 && companyId) {
      analyzeWithPatterns();
    }
  }, [symptoms, measurements, equipmentModel, companyId]);

  const analyzeWithPatterns = async () => {
    if (!companyId || symptoms.length === 0) return;

    setLoading(true);
    try {
      const season = getCurrentSeason();
      const response = await aiPatternsAPI.enhancedTroubleshoot({
        symptoms,
        measurements,
        equipmentModel,
        companyId,
        ambientConditions,
        season,
      });

      setPatternData(response);
    } catch (error) {
      console.error("Error in enhanced troubleshooting:", error);
      toast({
        title: "Pattern Analysis Failed",
        description:
          "Could not analyze patterns. Using standard troubleshooting.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  };

  const handleFeedbackSubmit = async (patternId: string) => {
    const feedbackData = feedback[patternId];
    if (!feedbackData) return;

    try {
      await aiPatternsAPI.updatePatternFeedback(patternId, {
        helpful: feedbackData.helpful,
        correct_diagnosis: feedbackData.correct_diagnosis,
        additional_notes: feedbackData.additional_notes,
        technician_rating: feedbackData.technician_rating,
      });

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping improve our AI diagnostics.",
      });

      if (onFeedbackSubmit) {
        onFeedbackSubmit(patternId, feedbackData);
      }

      setShowFeedback((prev) => ({ ...prev, [patternId]: false }));
    } catch (error) {
      toast({
        title: "Feedback Failed",
        description: "Could not submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRecommendationClick = (recommendation: PatternRecommendation) => {
    if (onRecommendationSelect) {
      onRecommendationSelect(recommendation);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600 dark:text-green-400";
    if (confidence >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 85)
      return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
    if (confidence >= 70)
      return "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800";
    return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 animate-pulse text-blue-500" />
            <div className="flex-1">
              <Progress value={66} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Analyzing historical patterns...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patternData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No pattern data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Pattern Summary Header */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Pattern-Enhanced Analysis
                  </CardTitle>
                  <CardDescription>
                    AI diagnostics powered by historical patterns
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-100 dark:bg-blue-900/30"
              >
                {patternData.patterns.length} patterns found
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={`text-2xl font-bold ${getConfidenceColor(85)}`}>
                  {patternData.confidence_summary.high_confidence}
                </div>
                <div className="text-xs text-muted-foreground">
                  High Confidence
                </div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${getConfidenceColor(75)}`}>
                  {patternData.confidence_summary.medium_confidence}
                </div>
                <div className="text-xs text-muted-foreground">
                  Medium Confidence
                </div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${getConfidenceColor(60)}`}>
                  {patternData.confidence_summary.low_confidence}
                </div>
                <div className="text-xs text-muted-foreground">
                  Low Confidence
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="recommendations"
              className="flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Recommendations
              {patternData.recommendations.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {patternData.recommendations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Pattern Details
              {patternData.patterns.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {patternData.patterns.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {patternData.recommendations.map((recommendation, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all hover:shadow-md ${getConfidenceBg(
                  recommendation.confidence,
                )}`}
                onClick={() => handleRecommendationClick(recommendation)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getPriorityIcon(recommendation.priority)}
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {recommendation.title}
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className={`ml-2 ${getConfidenceColor(recommendation.confidence)}`}
                              >
                                {recommendation.confidence}% confidence
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Based on{" "}
                                {recommendation.pattern_id
                                  ? "historical patterns"
                                  : "general diagnostics"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {recommendation.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {recommendation.parameter && (
                    <div className="mb-3 p-2 bg-background rounded border">
                      <span className="text-sm font-medium">Parameter: </span>
                      <span className="text-sm">
                        {recommendation.parameter}
                      </span>
                      {recommendation.deviation && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (Deviation: {recommendation.deviation})
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Recommended Actions:
                    </div>
                    <ul className="text-sm space-y-1">
                      {recommendation.recommended_actions.map(
                        (action, actionIndex) => (
                          <li
                            key={actionIndex}
                            className="flex items-center gap-2"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {action}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Feedback Section */}
                  {recommendation.pattern_id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Was this helpful?
                        </span>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFeedback((prev) => ({
                                    ...prev,
                                    [recommendation.pattern_id!]: {
                                      patternId: recommendation.pattern_id!,
                                      helpful: true,
                                      correct_diagnosis: true,
                                      technician_rating: 5,
                                    },
                                  }));
                                  setShowFeedback((prev) => ({
                                    ...prev,
                                    [recommendation.pattern_id!]: true,
                                  }));
                                }}
                                className={
                                  feedback[recommendation.pattern_id!]?.helpful
                                    ? "text-green-600"
                                    : ""
                                }
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Helpful</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFeedback((prev) => ({
                                    ...prev,
                                    [recommendation.pattern_id!]: {
                                      patternId: recommendation.pattern_id!,
                                      helpful: false,
                                      correct_diagnosis: false,
                                      technician_rating: 1,
                                    },
                                  }));
                                  setShowFeedback((prev) => ({
                                    ...prev,
                                    [recommendation.pattern_id!]: true,
                                  }));
                                }}
                                className={
                                  feedback[recommendation.pattern_id!]
                                    ?.helpful === false
                                    ? "text-red-600"
                                    : ""
                                }
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Not helpful</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {showFeedback[recommendation.pattern_id!] && (
                        <div className="mt-3 p-3 bg-muted rounded space-y-2">
                          <textarea
                            className="w-full p-2 text-sm border rounded resize-none"
                            rows={2}
                            placeholder="Additional notes (optional)..."
                            value={
                              feedback[recommendation.pattern_id!]
                                ?.additional_notes || ""
                            }
                            onChange={(e) =>
                              setFeedback((prev) => ({
                                ...prev,
                                [recommendation.pattern_id!]: {
                                  patternId: recommendation.pattern_id!,
                                  helpful: prev[recommendation.pattern_id!]?.helpful ?? true,
                                  correct_diagnosis: prev[recommendation.pattern_id!]?.correct_diagnosis ?? true,
                                  additional_notes: e.target.value,
                                  technician_rating: prev[recommendation.pattern_id!]?.technician_rating,
                                },
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">Rating:</span>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <Star
                                  key={rating}
                                  className={`h-3 w-3 cursor-pointer transition-colors ${
                                    (feedback[recommendation.pattern_id!]
                                      ?.technician_rating || 0) >= rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFeedback((prev) => ({
                                      ...prev,
                                      [recommendation.pattern_id!]: {
                                        patternId: recommendation.pattern_id!,
                                        helpful: prev[recommendation.pattern_id!]?.helpful ?? true,
                                        correct_diagnosis: prev[recommendation.pattern_id!]?.correct_diagnosis ?? true,
                                        additional_notes: prev[recommendation.pattern_id!]?.additional_notes,
                                        technician_rating: rating,
                                      },
                                    }));
                                  }}
                                />
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowFeedback((prev) => ({
                                    ...prev,
                                    [recommendation.pattern_id!]: false,
                                  }));
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFeedbackSubmit(
                                    recommendation.pattern_id!,
                                  );
                                }}
                              >
                                Submit
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {patternData.recommendations.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pattern-based recommendations available</p>
                  <p className="text-sm">
                    Try adding more symptoms or measurements
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pattern Details Tab */}
          <TabsContent value="patterns" className="space-y-4">
            {patternData.patterns.map((pattern, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base capitalize">
                          {pattern.pattern_type.replace("_", " ")} Pattern
                        </CardTitle>
                        <CardDescription>
                          Occurred {pattern.occurrence_count} times
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={getConfidenceColor(pattern.confidence_score)}
                    >
                      {pattern.confidence_score}% match
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Confidence:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={pattern.confidence_score}
                            className="flex-1 h-2"
                          />
                          <span
                            className={getConfidenceColor(
                              pattern.confidence_score,
                            )}
                          >
                            {pattern.confidence_score}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Relevance:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={pattern.relevance_score * 100}
                            className="flex-1 h-2"
                          />
                          <span
                            className={getConfidenceColor(
                              pattern.relevance_score * 100,
                            )}
                          >
                            {Math.round(pattern.relevance_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {pattern.match_details.matched_symptoms.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">
                          Matched Symptoms:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pattern.match_details.matched_symptoms.map(
                            (symptom, symptomIndex) => (
                              <Badge
                                key={symptomIndex}
                                variant="secondary"
                                className="text-xs"
                              >
                                {symptom.replace("_", " ")}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {pattern.pattern_data?.equipment_model && (
                      <div>
                        <span className="text-sm font-medium">
                          Equipment Model:
                        </span>
                        <div className="text-sm text-muted-foreground">
                          {pattern.pattern_data.equipment_model}
                          {pattern.match_details.equipment_match && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              Exact Match
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
