import type { TargetAndTransition, Transition } from "framer-motion";

export const FADE_DURATION_S = 0.2;
export const FADE_EASE = "easeInOut" as const;

export const fadeInitial: TargetAndTransition = { opacity: 0 };
export const fadeAnimate: TargetAndTransition = { opacity: 1 };
export const fadeExit: TargetAndTransition = { opacity: 0 };

export function fadeTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }

  return { duration: FADE_DURATION_S, ease: FADE_EASE };
}
