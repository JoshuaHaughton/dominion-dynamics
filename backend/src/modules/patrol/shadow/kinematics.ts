import type { Asset } from "@dominion-dynamics/shared";
import {
  PATROL_DRONE_ALT_M,
  PATROL_DRONE_SPEED_MPS,
  PATROL_MAX_INTERCEPT_MPS,
} from "../constants.js";

/** Cruise speed and patrol altitude for route following. */
export function withPatrolCruiseKinematics(asset: Asset): Asset {
  return {
    ...asset,
    speed: PATROL_DRONE_SPEED_MPS,
    alt: PATROL_DRONE_ALT_M,
  };
}

/** Max intercept speed back to the route after a shadow or dispatch mission ends. */
export function withRejoinKinematics(asset: Asset): Asset {
  return {
    ...asset,
    speed: PATROL_MAX_INTERCEPT_MPS,
    alt: PATROL_DRONE_ALT_M,
  };
}
