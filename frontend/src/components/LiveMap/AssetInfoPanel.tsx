import type { Asset, AssetZoneState, PatrolMode, ThreatLevel } from "@dominion-dynamics/shared";
import { icaoCategoryLabel } from "@dominion-dynamics/shared";
import {
  ASSET_PATROL_MODE_COLORS,
  ASSET_THREAT_COLORS,
} from "../../lib/constants/mapConstants.js";
import styles from "./AssetInfoPanel.module.css";

type AssetInfoPanelProps = {
  asset: Asset;
  assets: readonly Asset[];
  onClose: () => void;
};

function formatThreat(threat: ThreatLevel): string {
  return threat.charAt(0).toUpperCase() + threat.slice(1);
}

function formatPatrolMode(mode: PatrolMode): string {
  if (mode === "shadow") {
    return "Shadow";
  }

  if (mode === "rejoin") {
    return "Rejoin";
  }

  return "Patrol";
}

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

  const target = assets.find((candidate) => candidate.id === shadowTargetId);

  if (target?.callsign !== null && target?.callsign !== undefined) {
    return target.callsign;
  }

  return shadowTargetId;
}

function formatTte(zone: AssetZoneState): string {
  if (zone.threat === "critical") {
    return "Inside zone";
  }

  if (zone.zoneTteSeconds === null) {
    return "None";
  }

  if (zone.zoneTteSeconds < 60) {
    return `${Math.round(zone.zoneTteSeconds)}s`;
  }

  const minutes = Math.floor(zone.zoneTteSeconds / 60);
  const seconds = Math.round(zone.zoneTteSeconds % 60);

  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function formatDistanceM(distanceM: number | null): string {
  if (distanceM === null) {
    return "No zones";
  }

  if (distanceM === 0) {
    return "Inside zone";
  }

  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceM)} m`;
}

function formatSpeed(speed: number): string {
  return `${Math.round(speed)} m/s`;
}

function formatHeading(heading: number): string {
  return `${Math.round(heading)}°`;
}

function formatAltitude(altM: number): string {
  if (altM >= 1000) {
    return `${(altM / 1000).toFixed(1)} km`;
  }

  return `${Math.round(altM)} m`;
}

/** Selected asset summary; zone fields follow the live WS stream. */
export function AssetInfoPanel({ asset, assets, onClose }: AssetInfoPanelProps) {
  const zone = asset.zone;
  const drone = asset.drone;
  const route = drone?.patrol;
  const threatColor =
    zone !== null ? ASSET_THREAT_COLORS[zone.threat] : ASSET_THREAT_COLORS.normal;
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
    <aside className={styles.panel} aria-label="Asset details">
      <div className={styles.header}>
        <h2 className={styles.title}>{entityLabel}</h2>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
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
          <dd>{formatAltitude(asset.alt)}</dd>
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
                {formatPatrolMode(route.mode)}
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
              <dt>Dispatch target</dt>
              <dd>{formatShadowTarget(drone.dispatch.targetId, assets)}</dd>
            </div>
            <div className={styles.row}>
              <dt>Dispatch phase</dt>
              <dd>{drone.dispatch.phase}</dd>
            </div>
            <div className={styles.row}>
              <dt>Home airport</dt>
              <dd>
                {drone.dispatch.homeAirportName !== undefined
                  ? `${drone.dispatch.homeAirportName} (${drone.dispatch.homeAirportIdent})`
                  : drone.dispatch.homeAirportIdent}
              </dd>
            </div>
          </>
        ) : null}
        {zone !== null ? (
          <>
            <div className={styles.row}>
              <dt>Threat</dt>
              <dd style={{ color: threatColor }}>{formatThreat(zone.threat)}</dd>
            </div>
            <div className={styles.row}>
              <dt>Zone TTE</dt>
              <dd style={{ color: threatColor }}>{formatTte(zone)}</dd>
            </div>
            <div className={styles.row}>
              <dt>Nearest zone</dt>
              <dd>{formatDistanceM(zone.nearestBoundaryM)}</dd>
            </div>
          </>
        ) : null}
      </dl>
    </aside>
  );
}
