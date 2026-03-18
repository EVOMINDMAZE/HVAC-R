import {
  JohnsonControlsLogo,
  TraneLogo,
  CarrierLogo,
  DaikinLogo,
  LennoxLogo,
  HoneywellLogo,
} from './company-logos';

import type { ComponentType } from 'react';

export const companyLogos: Record<string, ComponentType<{ className?: string }>> = {
  "Johnson Controls": JohnsonControlsLogo,
  "Trane Technologies": TraneLogo,
  "Carrier": CarrierLogo,
  "Daikin": DaikinLogo,
  "Lennox": LennoxLogo,
  "Honeywell": HoneywellLogo,
};