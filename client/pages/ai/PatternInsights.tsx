import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  TrendingUp,
  Activity,
  Clock,
  Download,
  RefreshCw,
} from "lucide-react";
import { aiPatternsAPI } from "@/lib/ai-patterns";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PatternInsight {
  pattern_id: string;
  pattern_type: string;
  pattern_data: any;
  confidence_score: number;
  occurrence_count: number;
  last_seen: string;
  equipment_model?: string;
}

interface PatternAnalytics {
  totalPatterns: number;
  highConfidencePatterns: number;
  mediumConfidencePatterns: number;
  lowConfidencePatterns: number;
  patternsByType: Record<string, number>;
  recentActivity: Array<{
    date: string;
    symptom_outcome: number;
    equipment_failure: number;
    measurement_anomaly: number;
  }>;
  topSymptoms: Array<{
    symptom: string;
    count: number;
    success_rate: number;
  }>;
  equipmentReliability: Array<{
    model: string;
    failure_count: number;
    confidence: number;
  }>;
}

interface PatternInsightsProps {
  companyId: string;
}

export function PatternInsights({ companyId }: PatternInsightsProps) {
  const [insights, setInsights] = useState<PatternAnalytics | null>(null);
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [timeRange] = useState<string>("30d");
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      loadPatternData();
    }
  }, [companyId, selectedType, timeRange]);

  const loadPatternData = async () => {
    setLoading(true);
    try {
      let allPatterns: PatternInsight[] = [];
      const types =
        selectedType === "all"
          ? ["symptom_outcome", "equipment_failure", "measurement_anomaly"]
          : [selectedType];

      for (const type of types) {
        const response = await aiPatternsAPI.getPatternsByType(
          companyId,
          type,
          100,
        );
        if (response.success && response.data) {
          allPatterns = [...allPatterns, ...response.data];
        }
      }

      setPatterns(allPatterns);
      setInsights(generateAnalytics(allPatterns));
    } catch (error) {
      console.error("Error loading pattern data:", error);
      toast({
        title: "Failed to Load Pattern Data",
        description: "Could not retrieve pattern insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = (
    patternData: PatternInsight[],
  ): PatternAnalytics => {
    const totalPatterns = patternData.length;
    const highConfidencePatterns = patternData.filter(
      (p) => p.confidence_score >= 85,
    ).length;
    const mediumConfidencePatterns = patternData.filter(
      (p) => p.confidence_score >= 70 && p.confidence_score < 85,
    ).length;
    const lowConfidencePatterns = patternData.filter(
      (p) => p.confidence_score < 70,
    ).length;

    const patternsByType = patternData.reduce(
      (acc, pattern) => {
        acc[pattern.pattern_type] = (acc[pattern.pattern_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recentActivity = generateRecentActivityData(patternData);
    const topSymptoms = generateTopSymptomsData(patternData);
    const equipmentReliability = generateEquipmentReliabilityData(patternData);

    return {
      totalPatterns,
      highConfidencePatterns,
      mediumConfidencePatterns,
      lowConfidencePatterns,
      patternsByType,
      recentActivity,
      topSymptoms,
      equipmentReliability,
    };
  };

  const generateRecentActivityData = (patternData: PatternInsight[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split("T")[0] as string;
    });

    return last30Days.map((date) => {
      const dayPatterns = patternData.filter(
        (p) => new Date(p.last_seen).toISOString().split("T")[0] === date,
      );

      return {
        date,
        symptom_outcome: dayPatterns.filter(
          (p) => p.pattern_type === "symptom_outcome",
        ).length,
        equipment_failure: dayPatterns.filter(
          (p) => p.pattern_type === "equipment_failure",
        ).length,
        measurement_anomaly: dayPatterns.filter(
          (p) => p.pattern_type === "measurement_anomaly",
        ).length,
      };
    });
  };

  const generateTopSymptomsData = (patternData: PatternInsight[]) => {
    const symptomCounts = new Map<
      string,
      { count: number; success_count: number }
    >();

    patternData.forEach((pattern) => {
      if (
        pattern.pattern_type === "symptom_outcome" &&
        pattern.pattern_data?.symptoms
      ) {
        pattern.pattern_data.symptoms.forEach((symptom: string) => {
          const current = symptomCounts.get(symptom) || {
            count: 0,
            success_count: 0,
          };
          current.count++;
          if (pattern.pattern_data?.outcome === "success") {
            current.success_count++;
          }
          symptomCounts.set(symptom, current);
        });
      }
    });

    return Array.from(symptomCounts.entries())
      .map(([symptom, data]) => ({
        symptom,
        count: data.count,
        success_rate: (data.success_count / data.count) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const generateEquipmentReliabilityData = (patternData: PatternInsight[]) => {
    const equipmentData = new Map<
      string,
      { failure_count: number; total_confidence: number; pattern_count: number }
    >();

    patternData.forEach((pattern) => {
      if (
        pattern.pattern_type === "equipment_failure" &&
        pattern.equipment_model
      ) {
        const current = equipmentData.get(pattern.equipment_model) || {
          failure_count: 0,
          total_confidence: 0,
          pattern_count: 0,
        };
        current.failure_count++;
        current.total_confidence += pattern.confidence_score;
        current.pattern_count++;
        equipmentData.set(pattern.equipment_model, current);
      }
    });

    return Array.from(equipmentData.entries())
      .map(([model, data]) => ({
        model,
        failure_count: data.failure_count,
        confidence: data.total_confidence / data.pattern_count,
      }))
      .sort((a, b) => b.failure_count - a.failure_count)
      .slice(0, 10);
  };

  const exportData = () => {
    if (!insights) return;

    const exportData = {
      generated_at: new Date().toISOString(),
      company_id: companyId,
      analytics: insights,
      patterns: patterns,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pattern-insights-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Pattern insights have been downloaded as JSON.",
    });
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading pattern insights...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No pattern insights available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pattern Insights</h2>
          <p className="text-muted-foreground">
            AI learning from your historical troubleshooting data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pattern Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="symptom_outcome">Symptom Patterns</SelectItem>
              <SelectItem value="equipment_failure">
                Equipment Failures
              </SelectItem>
              <SelectItem value="measurement_anomaly">
                Measurement Anomalies
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadPatternData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patterns
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalPatterns}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High Confidence
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {insights.highConfidencePatterns}
            </div>
            <p className="text-xs text-muted-foreground">85%+ confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Medium Confidence
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {insights.mediumConfidencePatterns}
            </div>
            <p className="text-xs text-muted-foreground">70-85% confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Rate</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {insights.totalPatterns > 0
                ? Math.round(
                    (insights.highConfidencePatterns / insights.totalPatterns) *
                      100,
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              High confidence rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="symptoms">Top Symptoms</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pattern Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Pattern Distribution</CardTitle>
                <CardDescription>Patterns by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(insights.patternsByType).map(
                        ([type, count]) => ({
                          name: type
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase()),
                          value: count,
                        }),
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(insights.patternsByType).map(
                        (_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Confidence Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Confidence Distribution</CardTitle>
                <CardDescription>Pattern confidence levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>High Confidence (85%+)</span>
                      <span className="font-medium">
                        {insights.highConfidencePatterns}
                      </span>
                    </div>
                    <Progress
                      value={
                        (insights.highConfidencePatterns /
                          insights.totalPatterns) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Medium Confidence (70-85%)</span>
                      <span className="font-medium">
                        {insights.mediumConfidencePatterns}
                      </span>
                    </div>
                    <Progress
                      value={
                        (insights.mediumConfidencePatterns /
                          insights.totalPatterns) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Low Confidence (&lt;70%)</span>
                      <span className="font-medium">
                        {insights.lowConfidencePatterns}
                      </span>
                    </div>
                    <Progress
                      value={
                        (insights.lowConfidencePatterns /
                          insights.totalPatterns) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Pattern Activity</CardTitle>
              <CardDescription>
                Daily pattern creation over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={insights.recentActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="symptom_outcome"
                    stroke="#8884d8"
                    name="Symptom Patterns"
                  />
                  <Line
                    type="monotone"
                    dataKey="equipment_failure"
                    stroke="#82ca9d"
                    name="Equipment Failures"
                  />
                  <Line
                    type="monotone"
                    dataKey="measurement_anomaly"
                    stroke="#ffc658"
                    name="Measurement Anomalies"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Common Symptoms</CardTitle>
              <CardDescription>Frequency and success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={insights.topSymptoms}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="symptom"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Occurrences" />
                  <Bar
                    dataKey="success_rate"
                    fill="#82ca9d"
                    name="Success Rate %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Reliability</CardTitle>
              <CardDescription>
                Failure patterns by equipment model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={insights.equipmentReliability}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="model"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="failure_count"
                    fill="#ff7c7c"
                    name="Failure Count"
                  />
                  <Bar
                    dataKey="confidence"
                    fill="#8884d8"
                    name="Avg Confidence"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
