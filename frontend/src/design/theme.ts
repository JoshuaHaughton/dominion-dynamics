/**
 * Single source of truth for the color palette.
 *
 * MapLibre paint specs can't read CSS custom properties, so colors live here
 * in TS; main.tsx injects them onto :root at boot and the CSS modules consume
 * the vars. Non-color tokens (radii, z-indexes, insets) stay in
 * styles/tokens.css.
 */
export const themeColors = {
  "color-bg": "#020617",
  "color-surface": "#0f172a",
  "color-surface-muted": "#1e293b",
  "color-surface-glass": "rgb(15 23 42 / 0.94)",
  "color-overlay": "rgb(15 23 42 / 0.72)",
  "color-border": "#334155",
  "color-border-strong": "#64748b",
  "color-text": "#f8fafc",
  "color-text-secondary": "#e2e8f0",
  "color-text-muted": "#94a3b8",
  "color-text-subtle": "#cbd5e1",
  "color-accent": "#60a5fa",
  "color-accent-bg": "#172554",
  "color-accent-sky": "#38bdf8",
  "color-accent-bg-sky": "#0c4a6e",
  "color-accent-text-sky": "#e0f2fe",
  "color-accent-label": "#93c5fd",
  "color-accent-pin": "#1d4ed8",
  "color-success": "#22c55e",
  "color-danger": "#ef4444",
  "color-danger-bg": "#450a0a",
  "color-danger-border": "#7f1d1d",
  "color-danger-text": "#fecaca",
  // Panel threat tints intentionally differ from the map threat colors:
  // lighter text shades stay readable on the dark glass panels.
  "color-threat-warning-text": "#fcd34d",
  "color-threat-critical-text": "#fca5a5",
} as const;

/** Map-only hues that differ from panel text tints or UI tokens. */
export const mapColorPrimitives = {
  threatWarning: "#f59e0b",
  droneShadow: "#8b5cf6",
  droneRejoin: "#818cf8",
  dispatchBody: "#6366f1",
} as const;

/**
 * Map-layer palette consumed by MapLibre paint specs (lib/constants/mapConstants.ts).
 * Values overlap the UI tokens where the same hue is intended; map-only hues
 * (threat warning orange, drone mode purples) are defined here.
 */
export const mapPalette = {
  zone: themeColors["color-danger"],
  patrolPath: themeColors["color-accent-sky"],
  trafficRing: themeColors["color-text"],
  droneReturningRing: themeColors["color-text-muted"],
  threatNormal: themeColors["color-border-strong"],
  threatWarning: mapColorPrimitives.threatWarning,
  threatCritical: themeColors["color-danger"],
  droneShadow: mapColorPrimitives.droneShadow,
  droneRejoin: mapColorPrimitives.droneRejoin,
  dispatchBody: mapColorPrimitives.dispatchBody,
} as const;

/** Inject the color tokens as CSS custom properties (called once at boot). */
export function applyThemeColors(root: HTMLElement): void {
  for (const [name, value] of Object.entries(themeColors)) {
    root.style.setProperty(`--${name}`, value);
  }
}
