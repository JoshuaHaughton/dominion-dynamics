import { useReducedMotion, type HTMLMotionProps } from "framer-motion";
import {
  fadeAnimate,
  fadeExit,
  fadeInitial,
  fadeTransition,
} from "./fade.js";

type FadeMotionProps = Pick<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "exit" | "transition"
>;

/** Shared opacity fade props for motion elements inside an AnimatePresence parent. */
export function useFadeMotionProps(): FadeMotionProps {
  const reducedMotion = useReducedMotion() ?? false;

  return {
    initial: fadeInitial,
    animate: fadeAnimate,
    exit: fadeExit,
    transition: fadeTransition(reducedMotion),
  };
}
