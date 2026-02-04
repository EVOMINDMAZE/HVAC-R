import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, HelpCircle } from "lucide-react";

interface TechnicalTooltipProps {
  term: string;
  children: React.ReactNode;
  variant?: "info" | "help";
  className?: string;
}

const technicalTerms: Record<
  string,
  { title: string; description: string; details?: string }
> = {
  cop: {
    title: "Coefficient of Performance",
    description:
      "A measure of refrigeration efficiency. Higher values indicate better performance.",
    details:
      "COP = Cooling Capacity / Compressor Power Input. Typical values range from 2-6.",
  },
  superheat: {
    title: "Superheat",
    description:
      "Temperature above the saturation temperature at a given pressure.",
    details:
      "Ensures complete evaporation and prevents liquid refrigerant from entering the compressor.",
  },
  subcooling: {
    title: "Subcooling",
    description:
      "Temperature below the saturation temperature at a given pressure.",
    details:
      "Ensures complete condensation and improves system efficiency by providing more cooling capacity.",
  },
  refrigerant: {
    title: "Refrigerant",
    description:
      "Working fluid that transfers heat within the refrigeration cycle.",
    details:
      "Refrigerants are selected based on application, efficiency, safety, and environmental impact. Examples include R134a, R290, and CO₂ (R744).",
  },
  safety_class: {
    title: "Refrigerant Safety Classification",
    description: "ASHRAE safety rating based on toxicity and flammability.",
    details:
      "A1 = Non-toxic, Non-flammable (safest) | A2L = Non-toxic, Lower flammability | A2 = Non-toxic, Flammable | A3 = Non-toxic, Higher flammability | B1-B3 = Toxic variants",
  },
  gwp: {
    title: "Global Warming Potential",
    description:
      "Measure of how much heat a greenhouse gas traps in the atmosphere.",
    details:
      "Compared to CO2 over 100 years. Lower values are better for the environment. R134a GWP≈1430, R290 GWP≈3.",
  },
  odp: {
    title: "Ozone Depletion Potential",
    description: "Measure of how much a substance can deplete the ozone layer.",
    details:
      "Compared to CFC-11. 0 = No ozone depletion. Modern refrigerants should have ODP = 0.",
  },
  enthalpy: {
    title: "Specific Enthalpy",
    description: "Total energy content per unit mass of refrigerant.",
    details:
      "Measured in kJ/kg. Used to calculate heat transfer in evaporators and condensers.",
  },
  entropy: {
    title: "Specific Entropy",
    description: "Measure of energy distribution per unit mass.",
    details:
      "Measured in kJ/kg·K. Used in thermodynamic cycle analysis and efficiency calculations.",
  },
  quality: {
    title: "Vapor Quality",
    description: "Fraction of refrigerant that is in vapor phase (0-100%).",
    details:
      "0% = All liquid, 100% = All vapor. Important in two-phase regions like evaporators.",
  },
  evaporator: {
    title: "Evaporator",
    description:
      "Heat exchanger where refrigerant absorbs heat and evaporates.",
    details:
      "Provides cooling effect. Refrigerant changes from liquid to vapor.",
  },
  condenser: {
    title: "Condenser",
    description: "Heat exchanger where refrigerant rejects heat and condenses.",
    details:
      "Releases heat to environment. Refrigerant changes from vapor to liquid.",
  },
  compressor: {
    title: "Compressor",
    description: "Increases refrigerant pressure and temperature.",
    details: "Provides the work input to drive the refrigeration cycle.",
  },
  expansion_valve: {
    title: "Expansion Valve",
    description: "Reduces refrigerant pressure and temperature.",
    details:
      "Controls refrigerant flow and creates pressure drop for the cycle.",
  },
  coolprop_support: {
    title: "CoolProp Database Support",
    description: "Level of thermodynamic property data available.",
    details:
      "Full = Complete property data | Limited = Basic properties only | Partial = Some restrictions apply",
  },
  critical_temperature: {
    title: "Critical Temperature",
    description:
      "Highest temperature at which a refrigerant can exist as a liquid regardless of pressure.",
    details:
      "Above this point the refrigerant cannot condense. Staying below the critical temperature is essential for efficient condenser operation.",
  },
  critical_pressure: {
    title: "Critical Pressure",
    description:
      "Minimum pressure required to liquefy a refrigerant at its critical temperature.",
    details:
      "Helps define safe operating ranges for compressors and condensers. Often expressed in megapascals (MPa).",
  },
  minimum_temperature: {
    title: "Minimum Operating Temperature",
    description:
      "Lowest recommended temperature for stable refrigerant properties.",
    details:
      "Below this limit the refrigerant may freeze or fall outside validated property data, leading to unreliable calculations.",
  },
  maximum_temperature: {
    title: "Maximum Operating Temperature",
    description:
      "Highest recommended temperature for maintaining reliable refrigerant data.",
    details:
      "Exceeding this temperature can degrade lubricant, reduce efficiency, or invalidate thermodynamic data.",
  },
  density: {
    title: "Density",
    description: "Mass per unit volume of the refrigerant.",
    details:
      "Measured in kg/m³. Can be derived from state point properties or estimated using ideal gas approximations when needed.",
  },
  cooling_capacity: {
    title: "Cooling Capacity",
    description: "Total rate of heat removal provided by the evaporator.",
    details:
      "Typically measured in kilowatts (kW). Equals the refrigeration effect multiplied by mass flow rate.",
  },
  compressor_work: {
    title: "Compressor Work",
    description: "Mechanical power required to compress the refrigerant.",
    details:
      "Measured in kilowatts (kW). Directly impacts energy consumption and operating cost.",
  },
  heat_rejection: {
    title: "Heat Rejection",
    description: "Total heat rejected by the condenser to the surroundings.",
    details:
      "Measured in kilowatts (kW). Equal to cooling capacity plus compressor work for ideal cycles.",
  },
  mass_flow_rate: {
    title: "Mass Flow Rate",
    description: "Amount of refrigerant circulating per unit time.",
    details:
      "Measured in kilograms per second (kg/s). Influences compressor sizing and heat exchanger design.",
  },
  volumetric_flow_rate: {
    title: "Volumetric Flow Rate",
    description:
      "Volume of refrigerant flowing per unit time at compressor inlet conditions.",
    details:
      "Measured in cubic meters per second (m³/s). Important for selecting compressor displacement.",
  },
  temperature: {
    title: "Temperature",
    description: "Thermodynamic temperature of the refrigerant state point.",
    details:
      "Typically expressed in degrees Celsius (°C) in HVAC applications.",
  },
  pressure: {
    title: "Pressure",
    description: "Absolute pressure at the refrigerant state point.",
    details:
      "Measured in kilopascals (kPa). Determines saturation conditions and component operating limits.",
  },
};

export function TechnicalTooltip({
  term,
  children,
  variant = "info",
  className = "",
}: TechnicalTooltipProps) {
  const termData = technicalTerms[term.toLowerCase()];

  if (!termData) {
    return <>{children}</>;
  }

  const Icon = variant === "help" ? HelpCircle : Info;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 cursor-help ${className}`}
          >
            {children}
            <Icon className="h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <div className="font-semibold text-sm">{termData.title}</div>
            <div className="text-xs text-muted-foreground">
              {termData.description}
            </div>
            {termData.details && (
              <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                {termData.details}
              </div>
            )}
            <div className="pt-2 border-t mt-2">
              <a
                href={`/help-center?term=${encodeURIComponent(term)}`}
                className="text-xs text-orange-600 hover:underline"
              >
                Learn more in Help Center
              </a>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Quick helper for common technical terms
export const TechTerm = ({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) => <TechnicalTooltip term={term}>{children}</TechnicalTooltip>;
