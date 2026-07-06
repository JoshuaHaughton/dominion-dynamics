/** Patrol drone cruise speed in m/s (~155 kt). */
export const PATROL_DRONE_SPEED_MPS = 80;

/** Patrol altitude in meters. */
export const PATROL_DRONE_ALT_M = 500;

/** Top intercept speed while closing on critical traffic. */
export const PATROL_MAX_INTERCEPT_MPS = 300;

/** Fly this much faster than the target while intercepting. */
export const PATROL_CLOSING_MARGIN_MPS = 20;

/** Within this distance and behind the target, match its speed at the trail slot. */
export const SHADOW_MATCH_DISTANCE_M = 500;

/** Blend intercept speed down toward the target over this distance band. */
export const SHADOW_APPROACH_EASE_M = 150;

/** Switch from lead pursuit to lag trail beyond this range to the target. */
export const SHADOW_LEAD_LAG_THRESHOLD_M = 2_000;

/** How far ahead of the target to aim during lead pursuit. */
export const SHADOW_LEAD_SECONDS = 45;

/** Within this distance of the trail slot, match target speed. */
export const SHADOW_TRAIL_ARRIVAL_M = 75;

/** Max climb or descent rate while shadowing (m/s). */
export const PATROL_VERTICAL_RATE_MPS = 25;

/** Max angle off the target's tail to count as trailing behind it. */
export const SHADOW_TAIL_ANGLE_DEG = 45;

/** How far astern of the target the patrol drone aims while shadowing. */
export const SHADOW_TRAIL_OFFSET_M = 500;

/** Braking distance when approaching the trail slot or rejoin snap. */
export const PATROL_APPROACH_DECEL_M = 500;

/** When within this distance of a waypoint, advance to the next vertex. */
export const PATROL_WAYPOINT_ARRIVAL_M = 75;
