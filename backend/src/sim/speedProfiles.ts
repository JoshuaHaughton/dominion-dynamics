export const SPEED_PROFILES = {
  ga: { minMps: 40, maxMps: 80 },
  commercial: { minMps: 150, maxMps: 250 },
  rotorcraft: { minMps: 0, maxMps: 60 },
  drone: { minMps: 5, maxMps: 25 },
} as const;

export type SpeedProfileId = keyof typeof SPEED_PROFILES;

export const SYNTHETIC_PROFILE_WEIGHTS: Record<SpeedProfileId, number> = {
  ga: 0.35,
  commercial: 0.45,
  rotorcraft: 0.15,
  drone: 0.05,
};

/** Pick a synthetic speed profile from the configured weight table. */
export function pickSpeedProfile(): SpeedProfileId {
  const draw = Math.random();
  let cumulative = 0;

  for (const profileId of Object.keys(
    SYNTHETIC_PROFILE_WEIGHTS,
  ) as SpeedProfileId[]) {
    cumulative += SYNTHETIC_PROFILE_WEIGHTS[profileId];

    if (draw < cumulative) {
      return profileId;
    }
  }

  return "commercial";
}

/** Sample a speed in m/s for a given profile. */
export function sampleSpeedForProfile(profileId: SpeedProfileId): number {
  const { minMps, maxMps } = SPEED_PROFILES[profileId];

  return minMps + Math.random() * (maxMps - minMps);
}

/** Sample a synthetic speed using a weighted profile draw. */
export function sampleSyntheticSpeed(): number {
  return sampleSpeedForProfile(pickSpeedProfile());
}
