import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, MapPin, Brain, BarChart3, FileText, Settings, ChevronRight, ChevronLeft, Zap, Clock, CheckCircle, XCircle, AlertCircle, Users, Shield, TrendingUp, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";

// ====================
// DEMO DATA
// ====================

const emergencyScenario = {
  client: "ACME Corp",
  equipment: {
    name: "Chiller #3",
    model: "Carrier 30RB-0804",
    location: "Building A - Rooftop",
    refrigerant: "R-410A",
    fullCharge: 362, // lbs
  },
  leakData: {
    rate: 35.2, // Percentage
    annualLoss: 127, // lbs
    epaThreshold: 10, // Percentage for comfort cooling
    status: "critical" as const, // "critical" | "warning" | "stable"
    lastChecked: "2024-03-15",
  },
  technician: {
    name: "Mike Rodriguez",
    eta: 8, // minutes
    distance: 2.3, // miles
    specialty: "Carrier chillers",
    status: "en_route" as const, // "en_route" | "on_site" | "working" | "completed"
  },
};

const aiPatternData = {
  patternType: "Equipment Failure Prediction",
  confidence: 87,
  insight: "Carrier 30RB models fail 12x more often in Q3",
  historicalFailures: 47,
  affectedEquipment: [
    { id: "CH-001", risk: "high", daysToPredictedFailure: 12 },
    { id: "CH-003", risk: "medium", daysToPredictedFailure: 28 },
    { id: "CH-007", risk: "low", daysToPredictedFailure: 45 },
  ],
};

const professionalData = {
  thermodynamic: {
    cop: { before: 2.1, after: 2.8, improvement: 33 },
    capacity: 285, // kW
    refrigerant: "R-410A",
    phaseOutAlert: "2025-2030",
  },
  report: {
    title: "Chiller #3 - Emergency Repair Report",
    sections: ["Executive Summary", "Technical Analysis", "Recommendations"],
    branding: { company: "Your HVAC Company", logo: true },
  },
  automation: {
    rule: "If chiller temp > 45°F → Send SMS alert",
    testResult: "✓ Alert sent to +1 (555) 123-4567",
  },
};

// ====================
// DESIGN SYSTEM CONSTANTS
// ====================

// Color themes for each act (aligned with app theme)
const actThemes = {
  act1: {
    primary: "destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    card: "border-destructive/20 bg-destructive/5",
    highlightCard: "border-destructive/20 bg-destructive/5",
    buttonVariant: "destructive",
    iconColor: "text-destructive",
    successCard: "border-green-200 bg-green-50/50",
  },
  act2: {
    primary: "primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    card: "border-primary/20 bg-primary/5",
    highlightCard: "border-primary/20 bg-primary/5",
    buttonVariant: "primary",
    iconColor: "text-primary",
    successCard: "border-green-200 bg-green-50/50",
  },
  act3: {
    primary: "primary",
    badge: "bg-primary/10 text-primary border-primary/20",
    card: "border-primary/20 bg-primary/5",
    highlightCard: "border-primary/20 bg-primary/5",
    buttonVariant: "primary",
    iconColor: "text-primary",
    success: "bg-green-500",
    successCard: "border-green-200 bg-green-50/50",
  },
} as const;

// Spacing constants
const spacing = {
  section: "space-y-8",
  card: "space-y-6",
  grid: "gap-6 md:gap-8",
} as const;

// Typography constants
const typography = {
  actTitle: "text-2xl font-bold mb-3",
  actDescription: "text-muted-foreground text-lg",
  cardTitle: "flex items-center gap-3 text-xl",
  metricValue: "text-2xl font-bold",
  metricLabel: "text-sm text-muted-foreground",
} as const;

// Layout constants
const layout = {
  actGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  innerGrid: "grid grid-cols-1 md:grid-cols-2",
  metricGrid: "grid grid-cols-1 md:grid-cols-3",
} as const;

// ====================
// STANDARDIZED COMPONENTS
// ====================

interface ActHeaderProps {
  actNumber: 1 | 2 | 3;
  icon: React.ReactNode;
  title: string;
  description: string;
  theme?: keyof typeof actThemes;
}

function ActHeader({ actNumber, icon, title, description, theme = `act${actNumber}` as keyof typeof actThemes }: ActHeaderProps) {
  const themeConfig = actThemes[theme];
  
  return (
    <div className="text-center mb-6">
      <div className={`inline-flex items-center gap-2 px-4 py-2 ${themeConfig.badge} rounded-full mb-4`}>
        <span className={themeConfig.iconColor}>{icon}</span>
        <span className="text-sm font-medium">
          {actNumber === 1 && "8:47 AM - EMERGENCY ALERT"}
          {actNumber === 2 && "AI PATTERN DETECTED"}
          {actNumber === 3 && "PROFESSIONAL RESULTS"}
        </span>
      </div>
      <h3 className={typography.actTitle}>{title}</h3>
      <p className={typography.actDescription}>
        {description}
      </p>
    </div>
  );
}

interface StandardCardProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  variant?: "default" | "highlight" | "success";
  act?: 1 | 2 | 3;
}

function StandardCard({ children, title, icon, variant = "default", act = 1 }: StandardCardProps) {
  const themeConfig = actThemes[`act${act}`];
  
  const variantStyles = {
    default: "border-border bg-card",
    highlight: `${themeConfig.highlightCard} shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-primary/10`,
    success: themeConfig.successCard,
  };
  
  return (
    <Card className={`${variantStyles[variant]} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <CardHeader>
        <CardTitle className={typography.cardTitle}>
          {icon && <span className={themeConfig.iconColor}>{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={spacing.card}>
        {children}
      </CardContent>
    </Card>
  );
}

// ====================
// STORY PROGRESS COMPONENT
// ====================

interface StoryProgressProps {
  currentAct: 1 | 2 | 3;
  onActSelect: (act: 1 | 2 | 3) => void;
  progress: {
    act1: { leakInvestigated: boolean; dispatchClicked: boolean };
    act2: { patternViewed: boolean; fleetExplored: boolean };
    act3: { diagramViewed: boolean; reportGenerated: boolean; automationBuilt: boolean };
  };
}

function StoryProgress({ currentAct, onActSelect, progress }: StoryProgressProps) {
  const actLabels = ["Emergency", "Intelligence", "Professional"];
  
  return (
    <div className="flex flex-col items-center mb-10">
      {/* Connecting line with dots */}
      <div className="relative w-64 max-w-full mb-8">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-secondary -translate-y-1/2" />
        
        {/* Progress line */}
        <motion.div
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentAct - 1) / 2) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Dots */}
        <div className="relative flex justify-between">
          {[1, 2, 3].map((act) => {
            const isCompleted = progress[`act${act}` as keyof typeof progress] && 
              Object.values(progress[`act${act}` as keyof typeof progress]).every(Boolean);
            
            return (
              <button
                key={act}
                onClick={() => onActSelect(act as 1 | 2 | 3)}
                className="flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                aria-label={`Go to Act ${act}: ${actLabels[act-1]}${isCompleted ? " (completed)" : ""}`}
                aria-current={currentAct === act ? "step" : undefined}
              >
                <div className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentAct === act
                    ? 'border-primary bg-primary text-primary-foreground scale-110'
                    : isCompleted
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-secondary bg-background text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    act
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between w-64 max-w-full">
        {actLabels.map((label, index) => (
          <div
            key={label}
            className={`text-sm font-medium ${
              currentAct === index + 1 ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================
// ACT 1: THE EMERGENCY
// ====================

interface Act1Props {
  onProgress: (key: keyof StoryProgressProps["progress"]["act1"]) => void;
  onNext: () => void;
  prefersReducedMotion?: boolean;
}

function Act1_Emergency({ onProgress, onNext, prefersReducedMotion = false }: Act1Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [technicianPosition, setTechnicianPosition] = useState(0); // 0 to 100
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTechnicianPosition((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 80); // 8 seconds total animation
    
    return () => clearInterval(interval);
  }, []);

  const handleInvestigateLeak = () => {
    onProgress("leakInvestigated");
    setStep(2);
  };

  const handleDispatch = () => {
    onProgress("dispatchClicked");
    setTechnicianPosition(0); // Restart animation
  };

  return (
    <div className={spacing.section}>
      {/* Narrative Header */}
      <ActHeader
        actNumber={1}
        icon={<AlertTriangle className="h-5 w-5" />}
        title="The Compliance Crisis"
        description={`Your EPA compliance dashboard flashes red. ${emergencyScenario.client}'s chiller has a critical leak.`}
      />

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <div className={`flex items-center gap-3 ${step >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            1
          </div>
          <span className="text-base font-medium">Detect Leak</span>
        </div>
        <div className="w-16 h-0.5 bg-border" />
        <div className={`flex items-center gap-3 ${step >= 2 ? "text-foreground" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            2
          </div>
          <span className="text-base font-medium">Dispatch Tech</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* EPA Leak Calculator */}
            <StandardCard
              act={1}
              variant="highlight"
              title="EPA Leak Rate Calculator"
              icon={<AlertTriangle className="h-5 w-5" />}
            >
              <div className={layout.innerGrid}>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Equipment</div>
                  <div className="font-medium">{emergencyScenario.equipment.name}</div>
                  <div className="text-xs text-muted-foreground">{emergencyScenario.equipment.model}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Refrigerant</div>
                  <div className="font-medium">{emergencyScenario.equipment.refrigerant}</div>
                  <div className="text-xs text-muted-foreground">Full charge: {emergencyScenario.equipment.fullCharge} lbs</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Leak Rate</span>
                  <span className="font-bold text-destructive">{emergencyScenario.leakData.rate}%</span>
                </div>
                <Progress 
                  value={emergencyScenario.leakData.rate} 
                  max={50}
                  className="h-3 [&>div]:bg-destructive"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Stable (0-10%)</span>
                  <span>Warning (10-20%)</span>
                  <span className="text-destructive">Critical (20%+)</span>
                </div>
              </div>

              <div className={layout.innerGrid}>
                <div className="bg-background rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">EPA Threshold</div>
                  <div className="text-lg font-bold">{emergencyScenario.leakData.epaThreshold}%</div>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Annual Loss</div>
                  <div className="text-lg font-bold text-destructive">{emergencyScenario.leakData.annualLoss} lbs</div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleInvestigateLeak}
                  variant="destructive"
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Investigate Critical Leak
                </Button>
                <p className="text-xs text-destructive/70 mt-2 text-center">
                  Potential EPA fine: $10,000+ • Immediate action required
                </p>
              </div>
            </StandardCard>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Live Technician Tracking */}
            <StandardCard
              act={1}
              variant="default"
              title="Live Technician Tracking"
              icon={<MapPin className="h-5 w-5" />}
            >
              <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden border border-border">
                {/* Map Background */}
                <div className="absolute inset-0 bg-blue-50/30" />
                
                {/* Roads */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-border" />
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border" />
                
                {/* Technician Animation */}
                <motion.div
                  className="absolute bottom-4 left-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg"
                  animate={{
                    x: `${technicianPosition * 2.8}%`, // Move across map
                    y: `${Math.sin(technicianPosition * 0.1) * 5}px`, // Bounce effect
                  }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <Users className="h-5 w-5 text-white" />
                </motion.div>
                
                {/* Destination */}
                <div className="absolute top-4 right-4 w-12 h-12 bg-destructive/10 border-2 border-destructive/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <motion.div 
                    className="absolute inset-0 rounded-lg border-2 border-destructive/50"
                    animate={prefersReducedMotion ? { scale: 1, opacity: 0.5 } : { scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}
                  />
                </div>
                
                {/* Legend */}
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <span className="text-xs text-muted-foreground">Technician Mike</span>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive rounded-full" />
                  <span className="text-xs text-muted-foreground">Emergency Site</span>
                </div>
              </div>

              <div className={layout.metricGrid}>
                <div className="text-center">
                  <div className={typography.metricValue}>{emergencyScenario.technician.name}</div>
                  <div className={typography.metricLabel}>Expert: {emergencyScenario.technician.specialty}</div>
                </div>
                <div className="text-center">
                  <div className={typography.metricValue}>{emergencyScenario.technician.distance} mi</div>
                  <div className={typography.metricLabel}>Distance</div>
                </div>
                <div className="text-center">
                  <div className={typography.metricValue}>{emergencyScenario.technician.eta} min</div>
                  <div className={typography.metricLabel}>ETA</div>
                </div>
              </div>

              <Button 
                onClick={handleDispatch}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Dispatch Nearest Technician
              </Button>
            </StandardCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Button */}
      <div className="flex justify-between items-center mt-8">
        {step === 2 && (
          <Button
            variant="outline"
            onClick={() => setStep(1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Leak Analysis
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={onNext} className="gap-2">
          Continue to Act 2: The Intelligence
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ====================
// ACT 2: THE INTELLIGENCE
// ====================

interface Act2Props {
  onProgress: (key: keyof StoryProgressProps["progress"]["act2"]) => void;
  onNext: () => void;
  prefersReducedMotion?: boolean;
}

function Act2_Intelligence({ onProgress, onNext, prefersReducedMotion = false }: Act2Props) {
  const [viewedPattern, setViewedPattern] = useState(false);
  const [exploredFleet, setExploredFleet] = useState(false);

  const handleViewPattern = () => {
    onProgress("patternViewed");
    setViewedPattern(true);
  };

  const handleExploreFleet = () => {
    onProgress("fleetExplored");
    setExploredFleet(true);
  };

  return (
    <div className={spacing.section}>
      {/* Narrative Header */}
      <ActHeader
        actNumber={2}
        icon={<Brain className="h-5 w-5" />}
        title="The Intelligence"
        description="While fixing the leak, ThermoNeural's AI uncovers a hidden failure pattern across your fleet."
      />

      <div className={layout.actGrid}>
        {/* AI Pattern Insights */}
        <StandardCard
          act={2}
          variant="highlight"
          title="AI Pattern Insights"
          icon={<Brain className="h-5 w-5" />}
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pattern Type</span>
              <span className="font-bold text-primary">{aiPatternData.patternType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-bold text-primary">{aiPatternData.confidence}%</span>
            </div>
            <div className="text-sm text-muted-foreground mt-3">
              <span className="font-medium">Insight:</span> {aiPatternData.insight}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Affected Equipment</div>
            {aiPatternData.affectedEquipment.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div>
                  <div className="font-medium">{eq.id}</div>
                  <div className="text-xs text-muted-foreground">
                    Predicted failure in {eq.daysToPredictedFailure} days
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  eq.risk === "high" ? "bg-red-100 text-red-800" :
                  eq.risk === "medium" ? "bg-yellow-100 text-yellow-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {eq.risk.toUpperCase()} RISK
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleViewPattern}
            variant="outline"
            className="w-full"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Pattern Analysis
          </Button>
        </StandardCard>

        {/* Fleet Command Center */}
        <StandardCard
          act={2}
          variant="default"
          title="Fleet Command Center"
          icon={<Settings className="h-5 w-5" />}
        >
          <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-border">
                {/* Fleet Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Neural Scanning Effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                    animate={prefersReducedMotion ? { x: "0%" } : { x: ["-100%", "100%"] }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
                    {["CH-001", "CH-003", "CH-007", "CH-012", "CH-015", "CH-018"].map((id, idx) => {
                      const risk = aiPatternData.affectedEquipment.find(eq => eq.id === id)?.risk || "low";
                      return (
                        <motion.div
                          key={id}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center cursor-pointer shadow-sm ${
                            risk === "high" ? "bg-red-100 border-2 border-red-300 ring-4 ring-red-500/20" :
                            risk === "medium" ? "bg-yellow-100 border-2 border-yellow-300" :
                            "bg-green-100 border-2 border-green-300"
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          whileHover={{ scale: 1.1, zIndex: 20 }}
                          onClick={handleExploreFleet}
                        >
                          <div className={`text-xs font-bold ${
                            risk === "high" ? "text-red-800" :
                            risk === "medium" ? "text-yellow-800" :
                            "text-green-800"
                          }`}>
                            {id.split("-")[1]}
                          </div>
                          {risk === "high" && (
                            <motion.div 
                              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                              animate={prefersReducedMotion ? { scale: 1 } : { scale: [1, 1.3, 1] }}
                              transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
            
            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-xs text-muted-foreground">High Risk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-xs text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-xs text-muted-foreground">Low</span>
              </div>
            </div>
          </div>

          <div className={layout.metricGrid}>
            <div className="text-center">
              <div className={typography.metricValue}>{aiPatternData.historicalFailures}</div>
              <div className={typography.metricLabel}>Historical Failures</div>
            </div>
            <div className="text-center">
              <div className={typography.metricValue}>{aiPatternData.affectedEquipment.filter(eq => eq.risk === "high").length}</div>
              <div className={typography.metricLabel}>High Risk Units</div>
            </div>
            <div className="text-center">
              <div className={typography.metricValue}>12x</div>
              <div className={typography.metricLabel}>More Likely in Q3</div>
            </div>
          </div>

          <Button 
            onClick={handleExploreFleet}
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Explore Fleet Command Center
          </Button>
        </StandardCard>
      </div>

      {/* Next Button */}
      <div className="flex justify-end mt-8">
        <Button onClick={onNext} className="gap-2">
          Continue to Act 3: The Professional
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ====================
// ====================
// ACT 3: THE PROFESSIONAL
// ====================

interface Act3Props {
  onProgress: (key: keyof StoryProgressProps["progress"]["act3"]) => void;
  onNext: () => void;
  prefersReducedMotion?: boolean;
}

function Act3_Professional({ onProgress, onNext, prefersReducedMotion = false }: Act3Props) {
  const [viewedDiagram, setViewedDiagram] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(false);
  const [builtAutomation, setBuiltAutomation] = useState(false);

  const handleViewDiagram = () => {
    onProgress("diagramViewed");
    setViewedDiagram(true);
  };

  const handleGenerateReport = () => {
    onProgress("reportGenerated");
    setGeneratedReport(true);
  };

  const handleBuildAutomation = () => {
    onProgress("automationBuilt");
    setBuiltAutomation(true);
  };

  return (
    <div className={spacing.section}>
      {/* Narrative Header */}
      <ActHeader
        actNumber={3}
        icon={<FileText className="h-5 w-5" />}
        title="The Professional"
        description="Turn emergency response into professional deliverables with automated reports and preventive automation."
      />

      <div className={layout.actGrid}>
        {/* P-h Diagram Analysis */}
        <StandardCard
          act={3}
          variant="highlight"
          title="P-h Diagram Analysis"
          icon={<BarChart3 className="h-5 w-5" />}
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">COP Improvement</span>
              <span className="font-bold text-primary">{professionalData.thermodynamic.cop.improvement}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-bold text-primary">{professionalData.thermodynamic.capacity} kW</span>
            </div>
            <div className="text-sm text-muted-foreground mt-3">
              <span className="font-medium">Refrigerant:</span> {professionalData.thermodynamic.refrigerant}
              <div className="text-xs text-orange-600 mt-1">
                Phase-out alert: {professionalData.thermodynamic.phaseOutAlert}
              </div>
            </div>
          </div>

          {/* Realistic P-h Diagram Visualization */}
          <div className="relative h-32 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner group">
            <svg viewBox="0 0 100 60" className="w-full h-full p-2 overflow-visible">
              {/* Grid lines */}
              <line x1="10" y1="10" x2="10" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-slate-800" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-slate-800" />

              {/* Saturation Dome (The thermodynamic phase boundary) */}
              <path 
                d="M 15 50 Q 45 5 85 50" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1" 
                className="text-slate-700"
                strokeDasharray="2 1"
              />

              {/* Refrigeration Cycle Path */}
              <motion.path
                d="M 80 45 L 88 15 L 25 15 L 25 45 Z"
                fill="rgba(59, 130, 246, 0.1)"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary"
                initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, ease: "easeInOut", delay: 0.5 }}
              />

              {/* Cycle Points */}
              {[
                { x: 80, y: 45, label: "1" }, // Evaporator Exit / Compressor Inlet
                { x: 88, y: 15, label: "2" }, // Compressor Exit / Condenser Inlet
                { x: 25, y: 15, label: "3" }, // Condenser Exit / Expansion Inlet
                { x: 25, y: 45, label: "4" }  // Expansion Exit / Evaporator Inlet
              ].map((pt, i) => (
                <motion.circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="1.2"
                  className="fill-primary shadow-glow"
                  initial={prefersReducedMotion ? { scale: 1 } : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.2 + (i * 0.2), type: "spring", stiffness: 200 }}
                />
              ))}

              {/* Dynamic Labels */}
              <g className="text-[3px] font-bold fill-slate-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <text x="90" y="32" textAnchor="start">Comp</text>
                <text x="50" y="12" textAnchor="middle">Cond</text>
                <text x="12" y="32" textAnchor="start">Exp</text>
                <text x="50" y="48" textAnchor="middle">Evap</text>
              </g>
            </svg>
            
            <div className="absolute bottom-1 left-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest">P</div>
            <div className="absolute top-1 right-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest">h</div>
            
            {/* Visual indicator for "Intelligence" */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-primary/5 to-transparent opacity-30" />
          </div>

          <Button 
            onClick={handleViewDiagram}
            variant="outline"
            className="w-full"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View P-h Diagram Analysis
          </Button>
        </StandardCard>

        {/* Professional Report Generator */}
        <StandardCard
          act={3}
          variant="default"
          title="Professional Report"
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Report Sections</div>
            {professionalData.report.sections.map((section, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <div className="font-medium">{section}</div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-background rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Branding</span>
              <span className="text-sm font-medium">{professionalData.report.branding.company}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${professionalData.report.branding.logo ? "bg-green-500" : "bg-gray-300"}`} />
              {professionalData.report.branding.logo ? "Company logo included" : "No logo"}
            </div>
          </div>

          <Button 
            onClick={handleGenerateReport}
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Professional Report
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            PDF ready in seconds • Fully branded • Shareable link
          </p>
        </StandardCard>

        {/* Automation Builder */}
        <StandardCard
          act={3}
          variant="success"
          title="Automation Builder"
          icon={<Settings className="h-5 w-5" />}
        >
          <div className="p-3 bg-background rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-2">Rule Configuration</div>
            <div className="font-mono text-sm bg-green-50 p-3 rounded border border-green-200">
              {professionalData.automation.rule}
            </div>
          </div>

          <div className="p-3 bg-background rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-2">Test Result</div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{professionalData.automation.testResult}</span>
            </div>
          </div>

          <Button 
            onClick={handleBuildAutomation}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Build & Test Automation
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            No-code automation • Real-time alerts • Prevent future emergencies
          </p>
        </StandardCard>
      </div>

      {/* Completion Celebration */}
      {(viewedDiagram && generatedReport && builtAutomation) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6 bg-gradient-to-r from-primary/5 to-green-50 rounded-xl border border-border"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-4">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">STORY COMPLETE!</span>
          </div>
          <h4 className="text-lg font-bold mb-2">You've experienced ThermoNeural</h4>
          <p className="text-muted-foreground">
            From emergency detection to automated prevention—all in one platform.
          </p>
        </motion.div>
      )}

      {/* Final CTA */}
      <div className="flex justify-end mt-8">
        <Link to="/signup" className="w-full lg:w-auto">
          <Button size="lg" className="w-full gap-2">
            Get Full Access to ThermoNeural
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
// ====================
// MAIN COMPONENT
// ====================

export function MiniAppPlayground() {
  const [currentAct, setCurrentAct] = useState<1 | 2 | 3>(1);
  const [announcement, setAnnouncement] = useState("");
  const [storyProgress, setStoryProgress] = useState({
    act1: { leakInvestigated: false, dispatchClicked: false },
    act2: { patternViewed: false, fleetExplored: false },
    act3: { diagramViewed: false, reportGenerated: false, automationBuilt: false },
  });
  
  const prefersReducedMotion = useReducedMotion();

  const handleProgress = (act: 1 | 2 | 3, key: string) => {
    setStoryProgress(prev => ({
      ...prev,
      [`act${act}`]: {
        ...prev[`act${act}` as keyof typeof prev],
        [key]: true,
      },
    }));
  };

  const handleNext = () => {
    if (currentAct < 3) {
      setCurrentAct((prev) => prev + 1 as 1 | 2 | 3);
    }
  };

  const handlePrev = () => {
    if (currentAct > 1) {
      setCurrentAct((prev) => prev - 1 as 1 | 2 | 3);
    }
  };

  const handleActSelect = (act: 1 | 2 | 3) => {
    setCurrentAct(act);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  useEffect(() => {
    const actLabels = ["Emergency", "Intelligence", "Professional"];
    setAnnouncement(`Now viewing Act ${currentAct}: ${actLabels[currentAct - 1]}`);
  }, [currentAct]);

  return (
    <section id="interactive-demo" className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Experience ThermoNeural
          </h2>
          <p className="text-muted-foreground text-lg">
            Follow a real HVAC emergency through resolution. No credit card required.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Demo data for illustration only.
          </p>
        </motion.div>

        {/* Screen reader announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {announcement}
        </div>

        {/* Slide Container */}
        <div className="relative">
          {/* Slide Progress */}
          <div className="mb-10">
            <StoryProgress 
              currentAct={currentAct} 
              onActSelect={handleActSelect}
              progress={storyProgress}
            />
          </div>

          {/* Slide Card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            {/* Slide Header */}
            <div className="px-8 py-6 border-b border-border bg-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    {currentAct === 1 && 'The Compliance Crisis'}
                    {currentAct === 2 && 'AI Pattern Detection'}
                    {currentAct === 3 && 'Professional Results'}
                  </h3>
                  <p className="text-muted-foreground">
                    {currentAct === 1 && 'Emergency leak detection and response'}
                    {currentAct === 2 && 'Predictive analytics and fleet insights'}
                    {currentAct === 3 && 'Reports, diagrams, and automation'}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Slide {currentAct} of 3
                </div>
              </div>
            </div>

            {/* Slide Content */}
            <div className="p-8 min-h-[600px]">
              <AnimatePresence mode="wait">
                {currentAct === 1 && (
                  <motion.div
                    key="act1"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
                  >
                    <Act1_Emergency 
                      onProgress={(key) => handleProgress(1, key)}
                      onNext={handleNext}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </motion.div>
                )}
                {currentAct === 2 && (
                  <motion.div
                    key="act2"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
                  >
                    <Act2_Intelligence 
                      onProgress={(key) => handleProgress(2, key)}
                      onNext={handleNext}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </motion.div>
                )}
                {currentAct === 3 && (
                  <motion.div
                    key="act3"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
                  >
                    <Act3_Professional 
                      onProgress={(key) => handleProgress(3, key)}
                      onNext={handleNext}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Slide Navigation */}
            <div className="px-8 py-6 border-t border-border bg-secondary/30 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentAct === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {[1, 2, 3].map((act) => {
                  const actLabels = ["Emergency", "Intelligence", "Professional"];
                  return (
                    <button
                      key={act}
                      onClick={() => handleActSelect(act as 1 | 2 | 3)}
                      className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                        currentAct === act
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                      aria-label={`Go to Slide ${act}: ${actLabels[act-1]}`}
                      aria-current={currentAct === act ? "step" : undefined}
                    >
                      {act}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentAct === 3}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/signup">
            <Button size="lg" className="px-8 py-6 text-lg">
              Get Full Access to ThermoNeural
              <ArrowRight className="h-5 w-5 ml-3" />
            </Button>
          </Link>
          <p className="text-muted-foreground mt-4">
            Complete all 3 slides • Unlimited calculations • Team collaboration • Professional reports
          </p>
        </motion.div>
      </div>
    </section>
  );
}
