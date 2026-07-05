/** ICAO ADS-B emitter category (OpenSky state vector index 17). */
export type IcaoEmitterCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

export const ICAO_EMITTER_CATEGORY_LABELS: Record<IcaoEmitterCategory, string> = {
  0: "No information at all",
  1: "No ADS-B emitter category information",
  2: "Light (< 15,500 lbs)",
  3: "Small (15,500 to 75,000 lbs)",
  4: "Large (75,000 to 300,000 lbs)",
  5: "High vortex large (aircraft such as B-757)",
  6: "Heavy (> 300,000 lbs)",
  7: "High performance (> 5g acceleration and 400 kts)",
  8: "Rotorcraft",
  9: "Glider / sailplane",
  10: "Lighter-than-air",
  11: "Parachutist / skydiver",
  12: "Ultralight / hang-glider / paraglider",
  13: "Reserved",
  14: "Unmanned aerial vehicle",
  15: "Space / trans-atmospheric vehicle",
  16: "Surface vehicle – emergency vehicle",
  17: "Surface vehicle – service vehicle",
  18: "Point obstacle (includes tethered balloons)",
  19: "Cluster obstacle",
  20: "Line obstacle",
};

/** Shorter panel labels derived from the official ICAO names. */
export const ICAO_EMITTER_CATEGORY_SHORT_LABELS: Record<IcaoEmitterCategory, string> = {
  0: "No information",
  1: "No category information",
  2: "Light",
  3: "Small",
  4: "Large",
  5: "High vortex large",
  6: "Heavy",
  7: "High performance",
  8: "Rotorcraft",
  9: "Glider / sailplane",
  10: "Lighter-than-air",
  11: "Parachutist / skydiver",
  12: "Ultralight / hang-glider / paraglider",
  13: "Reserved",
  14: "Unmanned aerial vehicle",
  15: "Space / trans-atmospheric vehicle",
  16: "Surface vehicle – emergency",
  17: "Surface vehicle – service",
  18: "Point obstacle",
  19: "Cluster obstacle",
  20: "Line obstacle",
};

export function isIcaoEmitterCategory(value: number): value is IcaoEmitterCategory {
  return Number.isInteger(value) && value >= 0 && value <= 20;
}

export function icaoCategoryLabel(category: number): string {
  if (!isIcaoEmitterCategory(category)) {
    return ICAO_EMITTER_CATEGORY_LABELS[0];
  }

  return ICAO_EMITTER_CATEGORY_LABELS[category];
}

export function icaoCategoryShortLabel(category: number): string {
  if (!isIcaoEmitterCategory(category)) {
    return ICAO_EMITTER_CATEGORY_SHORT_LABELS[0];
  }

  return ICAO_EMITTER_CATEGORY_SHORT_LABELS[category];
}
