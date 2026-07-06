import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ASSET_DISPATCH_BODY_COLOR,
  ASSET_PATROL_MODE_COLORS,
  ASSET_THREAT_COLORS,
  DRONE_RING_COLORS,
  PATROL_PATH_LINE_COLOR,
  TRAFFIC_RING_COLOR,
  ZONE_FILL_COLOR,
  ZONE_OUTLINE_COLOR,
} from "../../lib/constants/mapConstants.js";
import { ModalPortal } from "../../lib/motion/ModalPortal.js";
import styles from "./MapLegendModal.module.css";

type LegendItemProps = {
  swatch: ReactNode;
  label: string;
  detail?: string;
};

function LegendItem({ swatch, label, detail }: LegendItemProps) {
  return (
    <li className={styles.item}>
      <span className={styles.swatch} aria-hidden="true">
        {swatch}
      </span>
      <p className={styles.label}>
        <span className={styles.labelStrong}>{label}</span>
        {detail !== undefined ? ` — ${detail}` : null}
      </p>
    </li>
  );
}

function CircleSwatch({ color }: { color: string }) {
  return (
    <span
      className={styles.circle}
      style={{ backgroundColor: color, borderColor: TRAFFIC_RING_COLOR }}
    />
  );
}

function SquareSwatch({
  fill,
  ring,
}: {
  fill: string;
  ring?: string;
}) {
  return (
    <span
      className={`${styles.square} ${ring !== undefined ? styles.squareRing : ""}`}
      style={{
        backgroundColor: fill,
        ...(ring !== undefined ? { ["--ring-color" as string]: ring } : {}),
      }}
    />
  );
}

function LineSwatch({
  color,
  dashed = false,
}: {
  color: string;
  dashed?: boolean;
}) {
  return (
    <span
      className={`${styles.lineSwatch} ${dashed ? styles.lineSwatchDashed : ""}`}
      style={{ borderTopColor: color }}
    />
  );
}

function ZoneSwatch() {
  return (
    <span
      className={styles.zoneSwatch}
      style={{
        ["--zone-color" as string]: ZONE_OUTLINE_COLOR,
        borderColor: ZONE_OUTLINE_COLOR,
        background: `color-mix(in srgb, ${ZONE_FILL_COLOR} 18%, transparent)`,
      }}
    />
  );
}

/** Header toggle + modal legend for map symbology and shortcuts. */
export function MapLegendModal() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-haspopup="dialog"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Legend
      </button>
      <ModalPortal
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        backdropClassName={styles.backdrop ?? ""}
        dialogClassName={styles.dialog ?? ""}
        ariaLabelledBy="map-legend-title"
      >
        <div className={styles.header}>
          <h2 id="map-legend-title" className={styles.title}>
            Map legend
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Close
          </button>
        </div>
        <div className={styles.body}>
          <section>
            <h3 className={styles.sectionTitle}>Traffic</h3>
            <ul className={styles.list}>
              <LegendItem
                swatch={<CircleSwatch color={ASSET_THREAT_COLORS.normal} />}
                label="Normal"
                detail="outside restricted zones"
              />
              <LegendItem
                swatch={<CircleSwatch color={ASSET_THREAT_COLORS.warning} />}
                label="Warning"
                detail="approaching a zone; time-to-entry in the info panel"
              />
              <LegendItem
                swatch={<CircleSwatch color={ASSET_THREAT_COLORS.critical} />}
                label="Critical"
                detail="inside a zone; triggers dispatch or patrol shadow"
              />
            </ul>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>Drones</h3>
            <ul className={styles.list}>
              <LegendItem
                swatch={
                  <SquareSwatch
                    fill={ASSET_PATROL_MODE_COLORS.patrol}
                    ring={DRONE_RING_COLORS.default}
                  />
                }
                label="Patrol drone"
                detail="cyan square on the saved patrol path; shadow and rejoin keep the same fill"
              />
              <LegendItem
                swatch={
                  <SquareSwatch
                    fill={ASSET_DISPATCH_BODY_COLOR}
                    ring={DRONE_RING_COLORS.default}
                  />
                }
                label="Dispatch drone"
                detail="indigo square from the nearest airport; same fill for every phase"
              />
              <LegendItem
                swatch={
                  <SquareSwatch
                    fill={ASSET_PATROL_MODE_COLORS.patrol}
                    ring={DRONE_RING_COLORS.criticalTarget}
                  />
                }
                label="Red ring"
                detail="shadowing or intercepting a critical track"
              />
              <LegendItem
                swatch={
                  <SquareSwatch
                    fill={ASSET_PATROL_MODE_COLORS.patrol}
                    ring={DRONE_RING_COLORS.returning}
                  />
                }
                label="Muted ring"
                detail="rejoining the patrol route or dispatch RTB"
              />
            </ul>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>Map overlays</h3>
            <ul className={styles.list}>
              <LegendItem
                swatch={<ZoneSwatch />}
                label="Restricted zone"
                detail="drawn polygon; threat is evaluated on the server"
              />
              <LegendItem
                swatch={<LineSwatch color={PATROL_PATH_LINE_COLOR} />}
                label="Patrol path"
                detail="saved route the patrol drone follows"
              />
              <LegendItem
                swatch={<LineSwatch color={TRAFFIC_RING_COLOR} />}
                label="Track history"
                detail="last five minutes for the selected asset"
              />
              <LegendItem
                swatch={<LineSwatch color={TRAFFIC_RING_COLOR} dashed />}
                label="Predicted path"
                detail="extrapolated from recent movement"
              />
            </ul>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>Shortcuts</h3>
            <p className={styles.hint}>
              Click an asset for the info panel and history line. Press{" "}
              <strong>F</strong> to follow the selection; <strong>Esc</strong>{" "}
              clears it.
            </p>
          </section>
        </div>
      </ModalPortal>
    </>
  );
}
