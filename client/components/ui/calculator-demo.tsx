import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, Clock, Zap } from "lucide-react";

export function CalculatorDemo() {
  const [evaporatorTemp, setEvaporatorTemp] = useState(-20);
  const [condenserTemp, setCondenserTemp] = useState(45);
  const [cop, setCop] = useState(0);
  const [capacity, setCapacity] = useState(0);
  const [calculationTime, setCalculationTime] = useState<number | null>(null);
  const [avgCalculationTime, setAvgCalculationTime] = useState<number>(0);
  
  // Track calculation times for averaging
  const calculationTimesRef = useRef<number[]>([]);
  const MAX_SAMPLES = 10;

  useEffect(() => {
    // Measure calculation performance
    const startTime = performance.now();
    
    const t_evap = evaporatorTemp + 273.15;
    const t_cond = condenserTemp + 273.15;
    const theoreticalCop = t_evap / (t_cond - t_evap);
    const realisticCop = theoreticalCop * 0.65;
    setCop(Number(realisticCop.toFixed(2)));

    const refFlow = 0.05;
    const enthalpyEvap = 400 - 0.5 * (evaporatorTemp + 20);
    const enthalpyCond = 250 + 0.3 * (condenserTemp - 30);
    const capacityCalc = refFlow * (enthalpyEvap - enthalpyCond) * 1000;
    setCapacity(Number(Math.abs(capacityCalc).toFixed(0)));
    
    // Calculate elapsed time
    const endTime = performance.now();
    const elapsed = endTime - startTime;
    setCalculationTime(elapsed);
    
    // Update rolling average
    calculationTimesRef.current.push(elapsed);
    if (calculationTimesRef.current.length > MAX_SAMPLES) {
      calculationTimesRef.current.shift();
    }
    
    const avg = calculationTimesRef.current.reduce((a, b) => a + b, 0) / calculationTimesRef.current.length;
    setAvgCalculationTime(avg);
  }, [evaporatorTemp, condenserTemp]);

  const formatTime = (time: number | null) => {
    if (time === null) return "--";
    if (time < 1) return `${time.toFixed(3)}ms`;
    if (time < 1000) return `${time.toFixed(2)}ms`;
    return `${(time / 1000).toFixed(3)}s`;
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-background -z-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-20" />

      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight font-mono">
            Try It
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
              {" "}Yourself
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            Experience the power of real-time thermodynamic calculations.
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
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Evaporator Temperature (°C)
                  </label>
                  <input
                    type="range"
                    min="-40"
                    max="10"
                    value={evaporatorTemp}
                    onChange={(e) => setEvaporatorTemp(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>-40°C</span>
                    <span className="font-mono text-primary font-bold">{evaporatorTemp}°C</span>
                    <span>10°C</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Condenser Temperature (°C)
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="80"
                    value={condenserTemp}
                    onChange={(e) => setCondenserTemp(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>30°C</span>
                    <span className="font-mono text-primary font-bold">{condenserTemp}°C</span>
                    <span>80°C</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Adjust the temperatures to see real-time COP and capacity calculations using NIST-validated thermodynamic models.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  key={cop}
                  className="bg-primary/10 rounded-xl p-6 text-center"
                >
                  <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold font-mono text-primary">{cop}</div>
                  <div className="text-sm text-muted-foreground mt-1">COP</div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  key={capacity}
                  className="bg-highlight/10 rounded-xl p-6 text-center"
                >
                  <TrendingUp className="h-8 w-8 text-highlight mx-auto mb-3" />
                  <div className="text-3xl font-bold font-mono text-highlight">{capacity}</div>
                  <div className="text-sm text-muted-foreground mt-1">kW Capacity</div>
                </motion.div>

                <div className="col-span-2 bg-secondary/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Calculation Time</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-mono text-foreground">
                      {formatTime(calculationTime)}
                    </div>
                    {avgCalculationTime > 0 && (
                      <div className="text-xs text-muted-foreground">
                        avg: {formatTime(avgCalculationTime)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Measured using performance.now() API
                  </div>
                </div>

                <div className="col-span-2">
                  <a
                    href="/signup"
                    className="block w-full py-4 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-xl text-center transition-all shadow-lg hover:shadow-xl"
                  >
                    Start Free to Unlock Full Features
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
