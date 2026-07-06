import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Asset } from "@dominion-dynamics/shared";
import { icaoCategoryLabel } from "@dominion-dynamics/shared";
import {
  ASSET_PATROL_MODE_COLORS,
  ASSET_THREAT_COLORS,
} from "../../lib/constants/mapConstants.js";
import {
  formatAssetZoneTte,
  formatDispatchBaseLabel,
  formatDispatchFocusField,
  formatDispatchFocusValue,
  formatDispatchPhase,
  formatInterceptEtaSeconds,
  formatMetersAsKmOrM,
  formatNearestZoneDistance,
  formatPatrolModeLabel,
  formatThreatLabel,
  resolveAssetLabel,
} from "../../lib/display/dispatchDisplayUtils.js";
import { useFadeMotionProps } from "../../lib/motion/useFadeMotion.js";
import styles from "./AssetInfoPanel.module.css";

type AssetInfoPanelProps = {
  asset: Asset;
  assets: readonly Asset[];
  isFollowingCamera: boolean;
  onFollowingChange: (isFollowing: boolean) => void;
  onClose: () => void;
};

function formatPatrolRoute(pathId: number | undefined): string {
  if (pathId === undefined) {
    return "Not assigned";
  }

  return `Saved (#${pathId})`;
}

function formatShadowTarget(
  shadowTargetId: string | null,
  assets: readonly Asset[],
): string {
  if (shadowTargetId === null) {
    return "None";
  }

  return resolveAssetLabel(shadowTargetId, assets);
}

function formatSpeed(speed: number): string {
  return `${Math.round(speed)} m/s`;
}

function formatHeading(heading: number): string {
  return `${Math.round(heading)}°`;
}

/** Selected asset summary; zone fields follow the live WS stream. */
export function AssetInfoPanel({
  asset,
  assets,
  isFollowingCamera,
  onFollowingChange,
  onClose,
}: AssetInfoPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fadeMotion = useFadeMotionProps();

  /** Move focus into the panel on open; hand it back on close. */
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closeButtonRef.current?.focus();

    return () => {
      previouslyFocused?.focus();
    };
  }, []);

  const zone = asset.zone;
  const drone = asset.drone;
  const route = drone?.patrol;
  const threatColor =
    zone !== null
      ? ASSET_THREAT_COLORS[zone.threat]
      : ASSET_THREAT_COLORS.normal;
  const patrolModeColor =
    route !== undefined
      ? ASSET_PATROL_MODE_COLORS[route.mode]
      : ASSET_PATROL_MODE_COLORS.patrol;
  const entityLabel =
    asset.role === "drone"
      ? drone?.origin === "dispatch"
        ? "Dispatch drone"
        : "Patrol drone"
      : "Traffic";

  return (
    <motion.aside
      className={styles.panel}
      aria-label="Asset details"
      {...fadeMotion}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{entityLabel}</h2>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.followButton} ${isFollowingCamera ? styles.followButtonActive : ""}`}
            aria-pressed={isFollowingCamera}
            onClick={() => {
              onFollowingChange(!isFollowingCamera);
            }}
          >
            Follow
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>ID</dt>
          <dd>{asset.id}</dd>
        </div>
        <div className={styles.row}>
          <dt>Role</dt>
          <dd>{entityLabel}</dd>
        </div>
        {asset.callsign !== null ? (
          <div className={styles.row}>
            <dt>Callsign</dt>
            <dd>{asset.callsign}</dd>
          </div>
        ) : null}
        <div className={styles.row}>
          <dt>Category</dt>
          <dd>{icaoCategoryLabel(asset.category)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Altitude</dt>
          <dd>{formatMetersAsKmOrM(asset.alt)}</dd>
        </div>
        {asset.originCountry !== null ? (
          <div className={styles.row}>
            <dt>Origin country</dt>
            <dd>{asset.originCountry}</dd>
          </div>
        ) : null}
        <div className={styles.row}>
          <dt>Speed</dt>
          <dd>{formatSpeed(asset.speed)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Heading</dt>
          <dd>{formatHeading(asset.heading)}</dd>
        </div>
        {route !== undefined ? (
          <>
            <div className={styles.row}>
              <dt>Mode</dt>
              <dd style={{ color: patrolModeColor }}>
                {formatPatrolModeLabel(route.mode)}
              </dd>
            </div>
            <div className={styles.row}>
              <dt>Shadow target</dt>
              <dd>{formatShadowTarget(route.shadowTargetId, assets)}</dd>
            </div>
            <div className={styles.row}>
              <dt>Route</dt>
              <dd>{formatPatrolRoute(route.pathId)}</dd>
            </div>
          </>
        ) : null}
        {drone?.dispatch !== undefined ? (
          <>
            <div className={styles.row}>
              <dt>{formatDispatchFocusField(drone.dispatch.phase)}</dt>
              <dd>
                {formatDispatchFocusValue(
                  drone.dispatch.phase,
                  drone.dispatch.targetId,
                  drone.dispatch.homeAirportIdent,
                  assets,
                  drone.origin,
                )}
              </dd>
            </div>
            <div className={styles.row}>
              <dt>Dispatch phase</dt>
              <dd>{formatDispatchPhase(drone.dispatch.phase)}</dd>
            </div>
            {drone.dispatch.interceptEtaSeconds !== null &&
            drone.dispatch.interceptEtaSeconds !== undefined ? (
              <div className={styles.row}>
                <dt>Intercept time</dt>
                <dd>
                  {formatInterceptEtaSeconds(
                    drone.dispatch.interceptEtaSeconds,
                  )}
                </dd>
              </div>
            ) : null}
            <div className={styles.row}>
              <dt>Base</dt>
              <dd>
                {formatDispatchBaseLabel(
                  drone.origin,
                  drone.dispatch.homeAirportIdent,
                )}
              </dd>
            </div>
          </>
        ) : null}
        {zone !== null ? (
          <>
            <div className={styles.row}>
              <dt>Threat</dt>
              <dd style={{ color: threatColor }}>
                {formatThreatLabel(zone.threat)}
              </dd>
            </div>
            <div className={styles.row}>
              <dt>Zone TTE</dt>
              <dd style={{ color: threatColor }}>{formatAssetZoneTte(zone)}</dd>
            </div>
            <div className={styles.row}>
              <dt>Nearest zone</dt>
              <dd>{formatNearestZoneDistance(zone.nearestBoundaryM)}</dd>
            </div>
          </>
        ) : null}
      </dl>
    </motion.aside>
  );
}
