import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode, Ref } from "react";
import { useFadeMotionProps } from "./useFadeMotion.js";

type ModalPortalProps = {
  open: boolean;
  onClose: () => void;
  backdropClassName: string;
  dialogClassName: string;
  ariaLabelledBy: string;
  children: ReactNode;
  dialogRef?: Ref<HTMLDivElement>;
};

/**
 * Portals a modal to document.body so it escapes map z-index/stacking contexts.
 * AnimatePresence owns backdrop + dialog exit fades.
 */
export function ModalPortal({
  open,
  onClose,
  backdropClassName,
  dialogClassName,
  ariaLabelledBy,
  children,
  dialogRef,
}: ModalPortalProps) {
  const fadeMotion = useFadeMotionProps();

  return createPortal(
    <AnimatePresence initial={false}>
      {open
        ? [
            <motion.button
              key="modal-backdrop"
              type="button"
              className={backdropClassName}
              aria-label="Close dialog"
              {...fadeMotion}
              onClick={onClose}
            />,
            <motion.div
              key="modal-dialog"
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={ariaLabelledBy}
              className={dialogClassName}
              {...fadeMotion}
            >
              {children}
            </motion.div>,
          ]
        : null}
    </AnimatePresence>,
    document.body,
  );
}
