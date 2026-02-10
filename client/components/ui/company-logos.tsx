// Company logo SVG components
// These are simplified representations for demonstration purposes

export function JohnsonControlsLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 30" className={className} fill="currentColor">
      <text x="0" y="20" fontSize="12" fontWeight="bold">Johnson</text>
      <text x="0" y="28" fontSize="10">Controls</text>
    </svg>
  );
}

export function TraneLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 30" className={className} fill="currentColor">
      <text x="0" y="22" fontSize="16" fontWeight="bold">Trane</text>
    </svg>
  );
}

export function CarrierLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 30" className={className} fill="currentColor">
      <text x="0" y="22" fontSize="14" fontWeight="bold">Carrier</text>
    </svg>
  );
}

export function DaikinLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 30" className={className} fill="currentColor">
      <text x="0" y="22" fontSize="14" fontWeight="bold">Daikin</text>
    </svg>
  );
}

export function LennoxLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 30" className={className} fill="currentColor">
      <text x="0" y="22" fontSize="14" fontWeight="bold">Lennox</text>
    </svg>
  );
}

export function HoneywellLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 30" className={className} fill="currentColor">
      <text x="0" y="22" fontSize="12" fontWeight="bold">Honeywell</text>
    </svg>
  );
}

// Map of company names to their logo components
export const companyLogos: Record<string, React.ComponentType<{ className?: string }>> = {
  "Johnson Controls": JohnsonControlsLogo,
  "Trane Technologies": TraneLogo,
  "Carrier": CarrierLogo,
  "Daikin": DaikinLogo,
  "Lennox": LennoxLogo,
  "Honeywell": HoneywellLogo,
};
