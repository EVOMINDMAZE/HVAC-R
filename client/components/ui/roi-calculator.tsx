import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, DollarSign, Clock, Users, Info, ChevronDown, ChevronUp } from "lucide-react";

export function ROICalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [teamSize, setTeamSize] = useState(5);
  const [timeSavingsPercent, setTimeSavingsPercent] = useState(40);
  const [weeklySavings, setWeeklySavings] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [annualSavings, setAnnualSavings] = useState(0);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    const savingsPerHour = hoursPerWeek * (timeSavingsPercent / 100);
    const weekly = savingsPerHour * hourlyRate * teamSize;
    const monthly = weekly * 4.33;
    const annual = monthly * 12;

    setWeeklySavings(weekly);
    setMonthlySavings(monthly);
    setAnnualSavings(annual);
  }, [hoursPerWeek, hourlyRate, teamSize, timeSavingsPercent]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-secondary/30">
      <div className="absolute inset-0 bg-background -z-30" />

      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight font-mono">
            Calculate Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
              {" "}Savings
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            See how much time and money ThermoNeural can save your team.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-8 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hours spent on calculations per week
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">1h</span>
                    <span className="font-mono text-primary font-bold">{hoursPerWeek} hours</span>
                    <span className="text-muted-foreground">40h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Average hourly rate ($)
                  </label>
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">$25</span>
                    <span className="font-mono text-primary font-bold">${hourlyRate}/hr</span>
                    <span className="text-muted-foreground">$200</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team size
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={teamSize}
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">1</span>
                    <span className="font-mono text-primary font-bold">{teamSize} people</span>
                    <span className="text-muted-foreground">20</span>
                  </div>
                </div>

                {/* Adjustable Time Savings */}
                <div className="pt-4 border-t border-border">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Expected time savings (%)
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="5"
                    value={timeSavingsPercent}
                    onChange={(e) => setTimeSavingsPercent(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">20%</span>
                    <span className="font-mono text-primary font-bold">{timeSavingsPercent}%</span>
                    <span className="text-muted-foreground">60%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Default: 40% (based on beta user feedback). Adjust based on your workflow.
                  </p>
                </div>

                {/* Methodology Toggle */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowMethodology(!showMethodology)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Info className="h-4 w-4" />
                    <span>How we calculate savings</span>
                    {showMethodology ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showMethodology && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground space-y-2">
                          <p className="font-medium text-foreground">Calculation Method:</p>
                          <p>• Weekly Savings = Hours × Time Savings % × Hourly Rate × Team Size</p>
                          <p>• Monthly = Weekly × 4.33 weeks</p>
                          <p>• Annual = Monthly × 12 months</p>
                          <p className="pt-2 border-t border-border text-xs">
                            <strong>Source:</strong> Based on time-tracking data from 50 beta users 
                            comparing manual calculations vs. ThermoNeural automation.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-primary/10 rounded-xl p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Weekly Savings</div>
                  <div className="text-4xl font-bold font-mono text-primary">
                    {formatCurrency(weeklySavings)}
                  </div>
                </div>

                <div className="bg-highlight/10 rounded-xl p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Monthly Savings</div>
                  <div className="text-4xl font-bold font-mono text-highlight">
                    {formatCurrency(monthlySavings)}
                  </div>
                </div>

                <div className="bg-success/10 rounded-xl p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Annual Savings</div>
                  <div className="text-4xl font-bold font-mono text-success">
                    {formatCurrency(annualSavings)}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground text-center">
                    <strong>*</strong> Actual results may vary based on usage patterns, 
                    calculation complexity, and team adoption. These estimates are for 
                    planning purposes only.
                  </p>
                </div>

                <a
                  href="/signup"
                  className="block w-full py-4 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-xl text-center transition-all shadow-lg hover:shadow-xl mt-4"
                >
                  Start Free
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
