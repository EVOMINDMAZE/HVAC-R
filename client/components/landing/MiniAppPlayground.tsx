import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, MapPin, Brain, BarChart3, FileText, Settings, ChevronRight, ChevronLeft, Zap, CheckCircle, Users, ArrowRight, Star, DollarSign, Crosshair, Terminal } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { hudFadeIn, staggerChildren } from "@/lib/animations/landingVariants";


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
    testResult: "✓ Alert sent to on-call technician",
  },
};

// ====================
// DESIGN SYSTEM CONSTANTS
// ====================

// Color themes for each act (aligned with app theme)
const actThemes = {
  act1: {
    primary: "destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20 font-display",
    card: "hud-border glass-card border-destructive/20",
    highlightCard: "hud-border glass-card border-destructive/30 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]",
    buttonVariant: "destructive",
    iconColor: "text-destructive",
    successCard: "border-green-200 bg-green-50/50",
  },
  act2: {
    primary: "primary",
    badge: "bg-primary/10 text-primary border-primary/20 font-display",
    card: "hud-border glass-card border-primary/20",
    highlightCard: "hud-border glass-card border-primary/30 shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]",
    buttonVariant: "primary",
    iconColor: "text-primary",
    successCard: "border-green-200 bg-green-50/50",
  },
  act3: {
    primary: "primary",
    badge: "bg-primary/10 text-primary border-primary/20 font-display",
    card: "hud-border glass-card border-primary/20",
    highlightCard: "hud-border glass-card border-primary/30 shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]",
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
  actTitle: "text-2xl font-bold mb-3 font-display uppercase tracking-tight",
  actDescription: "text-muted-foreground text-lg leading-relaxed",
  cardTitle: "flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] font-display",
  metricValue: "text-2xl font-bold font-display",
  metricLabel: "text-[10px] text-muted-foreground uppercase tracking-widest",
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
    <div className="text-center mb-10">
      <motion.div 
        variants={hudFadeIn}
        className={`inline-flex items-center gap-2 px-4 py-1.5 ${themeConfig.badge} rounded-full mb-6 border border-white/5 backdrop-blur-md`}
      >
        <span className={themeConfig.iconColor}>{icon}</span>
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase">
          {actNumber === 1 && "TIMESTAMP: 08:47:12 // EMERGENCY_ALERT"}
          {actNumber === 2 && "THERNONEURAL.AI // PATTERN_DETECTION"}
          {actNumber === 3 && "SYSTEM.OUTPUT // PROFESSIONAL_RESULTS"}
        </span>
      </motion.div>
      <motion.h3 variants={hudFadeIn} className={typography.actTitle}>{title}</motion.h3>
      <motion.p variants={hudFadeIn} className={typography.actDescription}>
        {description}
      </motion.p>
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
    default: themeConfig.card,
    highlight: themeConfig.highlightCard,
    success: themeConfig.successCard,
  };
  
  return (
    <Card className={`${variantStyles[variant]} transition-all duration-500 hover:border-primary/40 relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Crosshair className="w-8 h-8" />
      </div>
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className={typography.cardTitle}>
          {icon && <span className={themeConfig.iconColor}>{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={`${spacing.card} pt-6`}>
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
  const actLabels = ["EMERGENCY", "INTELLIGENCE", "PROFESSIONAL"];
  
  return (
    <div className="flex flex-col items-center mb-12">
      {/* Connecting line with dots */}
      <div className="relative w-80 max-w-full mb-8">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -translate-y-1/2" />
        
        {/* Progress line */}
        <motion.div
          className="absolute top-1/2 left-0 h-[1px] bg-primary -translate-y-1/2 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentAct - 1) / 2) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                className="flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background group"
                aria-label={`Go to Act ${act}: ${actLabels[act-1]}${isCompleted ? " (completed)" : ""}`}
                aria-current={currentAct === act ? "step" : undefined}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-500 ${
                  currentAct === act
                    ? 'border-primary bg-primary/10 text-primary scale-110 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    : isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-white/10 bg-black/40 text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <span className="font-display font-bold">{act}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between w-80 max-w-full px-2">
        {actLabels.map((label, index) => (
          <div
            key={label}
            className={`text-[10px] font-bold tracking-[0.2em] transition-colors duration-500 font-display ${
              currentAct === index + 1 ? 'text-primary' : 'text-muted-foreground/40'
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
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" className={spacing.section}>
      {/* Narrative Header */}
      <ActHeader
        actNumber={1}
        icon={<AlertTriangle className="h-5 w-5 animate-pulse" />}
        title="The Compliance Crisis"
        description={`Your EPA compliance dashboard flashes red. ${emergencyScenario.client}'s chiller has a critical leak.`}
      />

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-6 mb-12">
        <div className={`flex items-center gap-3 transition-colors duration-500 ${step >= 1 ? "text-primary" : "text-muted-foreground/30"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold border transition-all ${step >= 1 ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"}`}>
            1
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest font-display">Detect Leak</span>
        </div>
        <div className="w-16 h-[1px] bg-white/5" />
        <div className={`flex items-center gap-3 transition-colors duration-500 ${step >= 2 ? "text-primary" : "text-muted-foreground/30"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold border transition-all ${step >= 2 ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"}`}>
            2
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest font-display">Dispatch Tech</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* EPA Leak Calculator */}
            <StandardCard
              act={1}
              variant="highlight"
              title="EPA Leak Rate Calculator"
              icon={<Terminal className="h-4 w-4" />}
            >
              <div className={`${layout.innerGrid} gap-6`}>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[8px] text-white/40 uppercase tracking-widest font-display mb-2">Equipment.Asset</div>
                  <div className="font-bold font-display text-sm">{emergencyScenario.equipment.name}</div>
                  <div className="text-[10px] text-white/30 font-mono mt-1">{emergencyScenario.equipment.model}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[8px] text-white/40 uppercase tracking-widest font-display mb-2">Coolant.Charge</div>
                  <div className="font-bold font-display text-sm">{emergencyScenario.equipment.refrigerant}</div>
                  <div className="text-[10px] text-white/30 font-mono mt-1">TOTAL_CAP: {emergencyScenario.equipment.fullCharge} LBS</div>
                </div>
              </div>

              <div className="space-y-3 bg-black/40 p-6 rounded-xl border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-destructive/[0.03] animate-pulse" />
                <div className="flex justify-between items-end relative z-10">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-display">Calculated_Leak_Rate</span>
                  <span className="text-3xl font-bold text-destructive font-display tracking-tighter">{emergencyScenario.leakData.rate}%</span>
                </div>
                <Progress 
                  value={emergencyScenario.leakData.rate} 
                  max={50}
                  className="h-2 bg-white/5 rounded-full overflow-hidden"
                  indicatorClassName="bg-destructive shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                />
                <div className="flex justify-between text-[8px] text-white/30 font-mono pt-1">
                  <span>STABLE [0-10]</span>
                  <span className="text-destructive/50">CRITICAL [20+]</span>
                </div>
              </div>

              <div className={layout.innerGrid}>
                <div className="p-4 border-r border-white/5">
                  <div className="text-[8px] text-white/40 uppercase tracking-widest font-display mb-1">EPA_Threshold</div>
                  <div className="text-xl font-bold font-display">{emergencyScenario.leakData.epaThreshold}%</div>
                </div>
                <div className="p-4">
                  <div className="text-[8px] text-white/40 uppercase tracking-widest font-display mb-1">Est_Annual_Loss</div>
                  <div className="text-xl font-bold text-destructive font-display">{emergencyScenario.leakData.annualLoss} LBS</div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleInvestigateLeak}
                  variant="destructive"
                  aria-label="Initiate Emergency Protocol and Analysis"
                  className="w-full h-12 rounded-xl font-display uppercase tracking-widest text-[10px] font-bold shadow-lg shadow-destructive/20"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Initiate Emergency Protocol
                </Button>
                <div className="mt-4 flex items-center justify-center gap-2 text-[8px] font-mono text-destructive/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  FEDERAL_COMPLIANCE_RISK_DETECTED
                </div>
              </div>
            </StandardCard>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Live Fleet Command */}
            <StandardCard
              act={1}
              variant="default"
              title="Live Fleet Command"
              icon={<MapPin className="h-4 w-4" />}
            >
              <div className="relative h-56 bg-black rounded-xl overflow-hidden border border-white/10 group">
                {/* Map Background */}
                <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-74.006,40.7128,12/400x300?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.r_98_f99_f99_f99')] bg-cover grayscale" />
                
                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none border-[1px] border-primary/20 m-4 rounded-lg" />
                <div className="absolute top-6 left-6 w-4 h-4 border-t border-l border-primary/40" />
                <div className="absolute bottom-6 right-6 w-4 h-4 border-b border-r border-primary/40" />
                
                {/* Technician Animation */}
                <motion.div
                  className="absolute bottom-8 left-8 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md"
                  animate={{
                    x: `${technicianPosition * 3}%`, // Move across map
                    y: `${Math.sin(technicianPosition * 0.15) * 8}px`, // Bounce effect
                  }}
                  transition={{ type: "spring", stiffness: 40, damping: 10 }}
                >
                  <Users className="h-4 w-4 text-primary" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                </motion.div>
                
                {/* Destination */}
                <div className="absolute top-10 right-10 w-12 h-12 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                  <motion.div 
                    className="absolute inset-0 rounded-lg border border-destructive/50"
                    animate={prefersReducedMotion ? { scale: 1, opacity: 0.5 } : { scale: [1, 1.8], opacity: [0.5, 0] }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                  />
                </div>
                
                {/* Coordinates */}
                <div className="absolute bottom-6 right-8 text-[7px] font-mono text-white/30 space-y-0.5">
                  <div>LAT: 40.7128</div>
                  <div>LNG: -74.0060</div>
                </div>
              </div>

              <div className={`${layout.metricGrid} gap-4`}>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                  <div className={typography.metricValue}>08<span className="text-primary text-xs ml-0.5">M</span></div>
                  <div className={typography.metricLabel}>Est_ETA</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                  <div className={typography.metricValue}>2.3<span className="text-primary text-xs ml-0.5">MI</span></div>
                  <div className={typography.metricLabel}>Distance</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                  <div className="text-sm font-bold font-display leading-tight truncate px-1">M.RODRIGUEZ</div>
                  <div className={typography.metricLabel}>Lead_Tech</div>
                </div>
              </div>

              <Button 
                onClick={handleDispatch}
                aria-label="Finalize Dispatch Sync with Lead Technician"
                className="w-full h-12 rounded-xl font-display uppercase tracking-widest text-[10px] font-bold shadow-lg shadow-primary/20"
              >
                <Zap className="h-4 w-4 mr-2" />
                Finalize Dispatch Sync
              </Button>
            </StandardCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-12">
        {step === 2 ? (
          <Button
            variant="ghost"
            onClick={() => setStep(1)}
            aria-label="Return to Leak Analysis"
            className="text-[10px] font-bold uppercase tracking-widest font-display text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Return to Analysis
          </Button>
        ) : <div />}
        
        <Button onClick={onNext} aria-label="Advance to Act 2: Intelligence" className="h-12 px-8 rounded-xl font-display uppercase tracking-widest text-[10px] font-bold gap-3">
          Advance to Act 2: Intelligence
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
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
  const [, setViewedPattern] = useState(false);
  const [, setExploredFleet] = useState(false);

  const handleViewPattern = () => {
    onProgress("patternViewed");
    setViewedPattern(true);
  };

  const handleExploreFleet = () => {
    onProgress("fleetExplored");
    setExploredFleet(true);
  };

  return (
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" className={spacing.section}>
      {/* Narrative Header */}
      <ActHeader
        actNumber={2}
        icon={<Brain className="h-5 w-5 animate-pulse text-primary" />}
        title="Neural Pattern Recognition"
        description="ThermoNeural's AI engine analyzes live telemetry and historical logs to identify high-risk assets before they fail."
      />

      <div className={`${layout.actGrid} gap-8`}>
        {/* AI Pattern Insights */}
        <StandardCard
          act={2}
          variant="highlight"
          title="Neural Analytics"
          icon={<Brain className="h-4 w-4" />}
        >
          <div className="space-y-4 bg-black/40 p-5 rounded-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-primary/40 tracking-tighter">SCANNING_VECTORS...</div>
            <div className="space-y-1 relative z-10">
              <div className="text-[8px] text-white/40 uppercase tracking-widest font-display">Target_Pattern</div>
              <div className="font-bold font-display text-sm text-primary">{aiPatternData.patternType}</div>
            </div>
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[8px] text-white/40 uppercase tracking-widest font-display">Confidence_Score</span>
                <span className="text-xl font-bold text-primary font-display">{aiPatternData.confidence}%</span>
              </div>
              <Progress value={aiPatternData.confidence} className="h-1 bg-white/5" indicatorClassName="bg-primary" />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-display px-1 mb-2">High_Risk_Asset_Queue</div>
            {aiPatternData.affectedEquipment.map((eq, idx) => (
              <motion.div 
                key={eq.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-xl hover:border-primary/30 transition-colors group cursor-pointer"
              >
                <div>
                  <div className="font-bold font-display text-xs group-hover:text-primary transition-colors">{eq.id}</div>
                  <div className="text-[9px] text-white/30 font-mono mt-0.5 uppercase">
                    Failure Predicted: T-{eq.daysToPredictedFailure}D
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[8px] font-bold font-display tracking-widest ${
                  eq.risk === "high" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                  eq.risk === "medium" ? "bg-warning/10 text-warning border border-warning/20" :
                  "bg-success/10 text-success border border-success/20"
                }`}>
                  {eq.risk.toUpperCase()}
                </div>
              </motion.div>
            ))}
          </div>

          <Button 
            onClick={handleViewPattern}
            variant="outline"
            aria-label="View Full Model Specifications for Predictive Analysis"
            className="w-full border-white/10 font-display uppercase tracking-widest text-[9px] font-bold h-11"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-2" />
            Open Full Model Specs
          </Button>
        </StandardCard>

        {/* Fleet Command Center */}
        <StandardCard
          act={2}
          variant="default"
          title="Fleet.Grid_Nexus"
          icon={<Settings className="h-4 w-4" />}
        >
          <div className="relative h-64 bg-black rounded-xl overflow-hidden border border-white/10 group">
                {/* Fleet Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Neural Scanning Effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent z-10"
                    animate={prefersReducedMotion ? { x: "0%" } : { x: ["-100%", "100%"] }}
                    transition={prefersReducedMotion ? { duration: 3 } : { duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                  
                  {/* HUD Grid lines */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:20px_20px]" />
                  
                  <div className="grid grid-cols-3 gap-4 relative z-20">
                    {["CH-001", "CH-003", "CH-007", "CH-012", "CH-015", "CH-018"].map((id, idx) => {
                      const risk = aiPatternData.affectedEquipment.find(eq => eq.id === id)?.risk || "low";
                      return (
                        <motion.div
                          key={id}
                          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative ${
                            risk === "high" ? "bg-destructive/20 border border-destructive/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]" :
                            risk === "medium" ? "bg-warning/10 border border-warning/30" :
                            "bg-success/10 border border-success/30"
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.08 }}
                          whileHover={{ scale: 1.15, zIndex: 30 }}
                          onClick={handleExploreFleet}
                        >
                          <div className={`text-[9px] font-bold font-display ${
                            risk === "high" ? "text-destructive" :
                            risk === "medium" ? "text-warning" :
                            "text-success"
                          }`}>
                            {id.split("-")[1]}
                          </div>
                          {risk === "high" && (
                            <motion.div 
                              className="absolute inset-0 border border-destructive rounded-lg"
                              animate={prefersReducedMotion ? { opacity: 0.5 } : { opacity: [1, 0], scale: [1, 1.3] }}
                              transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
            
            {/* Status Panel Overlay */}
            <div className="absolute top-4 left-4 p-2 bg-black/60 rounded border border-white/10 backdrop-blur-md">
              <div className="text-[7px] font-mono text-white/40 leading-none">VITAL_SCAN_001</div>
              <div className="text-[10px] font-bold font-display text-primary">NODES: 42/42</div>
            </div>
          </div>

          <div className={`${layout.metricGrid} gap-4`}>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <div className={typography.metricValue}>{aiPatternData.historicalFailures}</div>
              <div className={typography.metricLabel}>Hist_Data</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <div className={typography.metricValue}>12<span className="text-primary text-xs ml-0.5">X</span></div>
              <div className={typography.metricLabel}>Risk_Mult</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <div className={typography.metricValue}>03<span className="text-destructive text-xs ml-0.5">!</span></div>
              <div className={typography.metricLabel}>Critical</div>
            </div>
          </div>

          <Button 
            onClick={handleExploreFleet}
            aria-label="Enter Tactical Command for Fleet Management"
            className="w-full h-11 rounded-xl font-display uppercase tracking-widest text-[9px] font-bold shadow-lg shadow-primary/10"
          >
            <Settings className="h-3.5 w-3.5 mr-2" />
            Enter Tactical Command
          </Button>
        </StandardCard>
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-12">
        <Button onClick={onNext} aria-label="Advance to Act 3: Professional" className="h-12 px-8 rounded-xl font-display uppercase tracking-widest text-[10px] font-bold gap-3">
          Advance to Act 3: Professional
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ====================
// ACT 3: THE PROFESSIONAL
// ====================

interface Act3Props {
  onProgress: (key: keyof StoryProgressProps["progress"]["act3"]) => void;
  onNext: () => void;
  prefersReducedMotion?: boolean;
}

function Act3_Professional({ onProgress, onNext: _onNext, prefersReducedMotion = false }: Act3Props) {
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
    <motion.div variants={staggerChildren} initial="hidden" animate="visible" className={spacing.section}>
      {/* Narrative Header */}
      <ActHeader
        actNumber={3}
        icon={<FileText className="h-5 w-5 animate-pulse text-primary" />}
        title="Tactical Resolution"
        description="Convert intelligence into action. Generate engineering-grade analytics, branded reports, and business automation in real-time."
      />

      <div className={`${layout.actGrid} gap-8`}>
        {/* P-h Diagram Analysis */}
        <StandardCard
          act={3}
          variant="highlight"
          title="Dynamic_Ph_Model"
          icon={<BarChart3 className="h-4 w-4" />}
        >
          <div className="bg-black/40 p-5 rounded-xl border border-white/5 mb-4">
            <div className={`${layout.innerGrid} gap-6 mb-4`}>
              <div className="space-y-0.5">
                <div className="text-[8px] text-white/40 uppercase tracking-widest font-display">COP_Delta</div>
                <div className="text-xl font-bold font-display text-primary">+{professionalData.thermodynamic.cop.improvement}%</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[8px] text-white/40 uppercase tracking-widest font-display">Cap_Load</div>
                <div className="text-xl font-bold font-display">{professionalData.thermodynamic.capacity} <span className="text-[10px] text-primary">KW</span></div>
              </div>
            </div>

            {/* Realistic P-h Diagram Visualization */}
            <div className="relative h-40 bg-slate-950 rounded-lg overflow-hidden border border-white/5 shadow-inner group">
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] text-primary" />
              <svg viewBox="0 0 100 60" className="w-full h-full p-4 overflow-visible relative z-10">
                {/* Axis Labels */}
                <g className="text-[3px] font-mono fill-white/20">
                  <text x="5" y="55" transform="rotate(-90 5 55)">PRESSURE (P)</text>
                  <text x="95" y="58" textAnchor="end">ENTHALPY (h)</text>
                </g>

                {/* Saturation Dome */}
                <path 
                  d="M 15 50 Q 45 5 85 50" 
                  fill="none" 
                  stroke="rgba(6, 182, 212, 0.2)" 
                  strokeWidth="0.5" 
                  strokeDasharray="2 1"
                />

                {/* Refrigeration Cycle Path */}
                <motion.path
                  d="M 80 45 L 88 15 L 25 15 L 25 45 Z"
                  fill="rgba(6, 182, 212, 0.05)"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-primary"
                  initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                />

                {/* Points */}
                {[
                  { x: 80, y: 45 }, { x: 88, y: 15 }, { x: 25, y: 15 }, { x: 25, y: 45 }
                ].map((pt, i) => (
                  <motion.circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="1.2"
                    className="fill-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + i * 0.2 }}
                  />
                ))}
              </svg>
              
              {/* Scanline */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-4 w-full z-20 pointer-events-none"
                animate={{ y: ["-100%", "400%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>

          <Button 
            onClick={handleViewDiagram}
            variant="outline"
            aria-label="Export Thermodynamic Cycle Data"
            className="w-full border-white/10 font-display uppercase tracking-widest text-[9px] font-bold h-11"
          >
            <Terminal className="h-3.5 w-3.5 mr-2" />
            Export Thermodynamic Data
          </Button>
        </StandardCard>

        {/* Professional Report Generator */}
        <StandardCard
          act={3}
          variant="default"
          title="Report.Engine"
          icon={<FileText className="h-4 w-4" />}
        >
          <div className="space-y-3 mb-6">
            {professionalData.report.sections.map((section, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl group hover:border-primary/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-black border border-white/10 text-primary flex items-center justify-center text-[10px] font-bold font-display group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {idx + 1}
                </div>
                <div className="font-bold font-display text-[11px] uppercase tracking-wider">{section}</div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-white/40 uppercase tracking-widest font-display">Client_Branding</span>
              <span className="text-[10px] font-bold font-display text-success">ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/30">
              <CheckCircle className="h-3 w-3 text-success" />
              HQ_ASSET_LOGS_SYNCED
            </div>
          </div>

          <Button 
            onClick={handleGenerateReport}
            aria-label="Generate and Download PDF Technical Report"
            className="w-full h-11 rounded-xl font-display uppercase tracking-widest text-[9px] font-bold shadow-lg shadow-primary/10"
          >
            <FileText className="h-3.5 w-3.5 mr-2" />
            Generate PDF Analysis
          </Button>
        </StandardCard>

        {/* Automation Engine (Precision Engineering Hub) */}
        <div className="relative">
          <StandardCard
            act={3}
            variant="success"
            title="AutoPilot_Core"
            icon={<Zap className="h-4 w-4 text-primary" />}
          >
            <div className="absolute -top-3 -right-3 z-30 bg-primary text-primary-foreground text-[8px] font-bold px-3 py-1.5 rounded-full shadow-xl font-display uppercase tracking-widest border border-white/20">
              AUTOMATION_ENGINE
            </div>

            <div className="space-y-4">
              {/* Review Hunter */}
              <div className="p-5 bg-black/40 border border-primary/20 rounded-xl relative overflow-hidden group hover:border-primary/40 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Star className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <div className="text-[11px] font-bold font-display uppercase tracking-wider">Review Hunter</div>
                </div>
                <div className="text-[9px] text-white/30 font-mono mb-2 uppercase">Trigger: JOB_STATUS == COMPLETE</div>
                <div className="flex items-center gap-2 text-primary font-bold font-display text-xs">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>✓ Review request sent on completion</span>
                </div>
              </div>

              {/* Invoice Chaser */}
              <div className="p-5 bg-black/40 border border-white/5 rounded-xl relative overflow-hidden group hover:border-primary/20 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <DollarSign className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-white/60 flex items-center justify-center border border-white/10">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="text-[11px] font-bold font-display uppercase tracking-wider">Invoice Chaser</div>
                </div>
                <div className="text-[9px] text-white/30 font-mono mb-2 uppercase">Trigger: T+72H_UNPAID</div>
                <div className="flex items-center gap-2 text-white/40 font-bold font-display text-xs">
                  <CheckCircle className="h-3.5 w-3.5 opacity-40" />
                  <span>✓ Follow-up scheduled for unpaid invoice</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                onClick={handleBuildAutomation}
                aria-label="Activate Global Business Automation Logic"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-display uppercase tracking-[0.2em] text-[10px] font-bold rounded-xl shadow-xl shadow-primary/20 transition-all"
              >
                <Zap className="h-4 w-4 mr-2" />
                Activate Global Logic
              </Button>
            </div>
          </StandardCard>
        </div>
      </div>

      {/* Completion Celebration */}
      {(viewedDiagram && generatedReport && builtAutomation) && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="text-center p-16 sm:p-24 bg-black border border-primary/20 rounded-3xl relative overflow-hidden shadow-2xl mt-20"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] text-primary" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full mb-8 font-display text-[10px] font-bold tracking-[0.3em] uppercase">
              <CheckCircle className="h-4 w-4" />
              Session.Resolution.Complete
            </div>
            <h4 className="text-3xl font-bold font-display uppercase tracking-tight mb-4">Total Efficiency Unlocked</h4>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              From emergency detection to automated business scaling—you've seen how the next generation of HVAC operations functions.
            </p>
          </div>
        </motion.div>
      )}

      {/* Final CTA */}
      <div className="flex justify-end mt-20">
        <Link to="/signup" className="w-full lg:w-auto">
          <Button size="lg" aria-label="Provision Workspace and Get Started" className="w-full h-14 px-12 rounded-xl font-display uppercase tracking-[0.2em] text-xs font-bold gap-4 shadow-2xl shadow-primary/20">
            Provision My Workspace
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </motion.div>
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
    <section id="interactive-demo" className="py-24 px-4 relative overflow-hidden bg-black/40">
      {/* Background HUD Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] text-primary">
        <div className="absolute top-20 left-10 text-[10px] font-mono rotate-90 uppercase tracking-[0.5em]">SYSTEM_STABILITY: 99.8%</div>
        <div className="absolute bottom-20 right-10 text-[10px] font-mono -rotate-90 uppercase tracking-[0.5em]">THERNONEURAL_GRID_v4.2.0</div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Main Title */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="text-center mb-16"
        >
          <motion.div variants={hudFadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full mb-6 border border-primary/20">
            <Zap className="h-3 w-3" />
            <span className="text-[10px] font-bold tracking-[0.2em] font-display uppercase">Interactive Simulator</span>
          </motion.div>
          <motion.h2 variants={hudFadeIn} className="text-4xl sm:text-5xl font-bold mb-6 font-display tracking-tight uppercase">
            Experience <span className="text-primary">The System</span>
          </motion.h2>
          <motion.p variants={hudFadeIn} className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
            Take command and follow a real HVAC operation from initial emergency detection to tactical resolution.
          </motion.p>
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
          <StoryProgress 
            currentAct={currentAct} 
            onActSelect={handleActSelect}
            progress={storyProgress}
          />

          {/* Slide Card */}
          <div className="hud-border glass-card rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10 transition-all duration-700 hover:border-primary/20 border-white/5">
            {/* Slide Header */}
            <div className="px-10 py-8 border-b border-white/5 bg-black/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="text-[10px] font-bold font-display uppercase tracking-[0.3em] text-primary">
                    ACT_{currentAct}: STATUS_SYNCED
                  </h3>
                </div>
                <h4 className="text-2xl font-bold font-display uppercase tracking-tight">
                  {currentAct === 1 && 'Tactical Response'}
                  {currentAct === 2 && 'Predictive Intelligence'}
                  {currentAct === 3 && 'Operational Results'}
                </h4>
              </div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] border border-white/10 px-4 py-2 rounded-lg bg-black/20">
                MODULE:TN_{currentAct}_VIEW
              </div>
            </div>

            {/* Slide Content */}
            <div className="p-10 min-h-[700px] bg-black/20 relative">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-white/5 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-white/5 pointer-events-none" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentAct}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {currentAct === 1 && (
                    <Act1_Emergency
                      onProgress={(key) => handleProgress(1, key)}
                      onNext={handleNext}
                      prefersReducedMotion={prefersReducedMotion ?? undefined}
                    />
                  )}
                  {currentAct === 2 && (
                    <Act2_Intelligence
                      onProgress={(key) => handleProgress(2, key)}
                      onNext={handleNext}
                      prefersReducedMotion={prefersReducedMotion ?? undefined}
                    />
                  )}
                  {currentAct === 3 && (
                    <Act3_Professional
                      onProgress={(key) => handleProgress(3, key)}
                      onNext={handleNext}
                      prefersReducedMotion={prefersReducedMotion ?? undefined}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide Navigation */}
            <div className="px-10 py-6 border-t border-white/5 bg-black/40 flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentAct === 1}
                aria-label="Previous Act"
                className="gap-3 rounded-xl font-display text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous_Act
              </Button>

              <div className="hidden sm:flex items-center gap-4">
                {[1, 2, 3].map((act) => (
                  <button
                    key={act}
                    onClick={() => handleActSelect(act as 1 | 2 | 3)}
                    aria-label={`Go to Act ${act}`}
                    aria-current={currentAct === act ? "step" : undefined}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-all duration-500 font-display font-bold border ${
                      currentAct === act
                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 border-white/5 text-muted-foreground hover:border-white/20'
                    }`}
                  >
                    0{act}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                onClick={handleNext}
                disabled={currentAct === 3}
                aria-label="Next Act"
                className="gap-3 rounded-xl font-display text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                Next_Act
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Final CTA Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="text-[10px] font-display font-bold text-muted-foreground/40 uppercase tracking-[0.5em] mb-4">
            END_OF_SIMULATION_DATA
          </div>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed italic">
            "Follow the data. Command the operation. Dominate the market."
          </p>
        </motion.div>
      </div>
    </section>
  );
}
