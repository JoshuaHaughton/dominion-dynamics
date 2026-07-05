import type { Asset } from "@dominion-dynamics/shared";
import { icaoCategoryLabel } from "@dominion-dynamics/shared";
import { ASSET_THREAT_COLORS } from "../../lib/constants/mapConstants.js";
import styles from "./AssetInfoPanel.module.css";

type AssetInfoPanelProps = {
  asset: Asset;
  onClose: () => void;
};

function formatThreat(threat: Asset["threat"]): string {
  return threat.charAt(0).toUpperCase() + threat.slice(1);
}

function formatTte(asset: Asset): string {
  if (asset.threat === "critical") {
    return "Inside zone";
  }

  if (asset.tteSeconds === null) {
    return "None";
  }

  if (asset.tteSeconds < 60) {
    return `${Math.round(asset.tteSeconds)}s`;
  }

  const minutes = Math.floor(asset.tteSeconds / 60);
  const seconds = Math.round(asset.tteSeconds % 60);

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

/** Selected asset summary; threat and TTE follow the live WS stream. */
export function AssetInfoPanel({ asset, onClose }: AssetInfoPanelProps) {
  const threatColor = ASSET_THREAT_COLORS[asset.threat];

  return (
    <aside className={styles.panel} aria-label="Asset details">
      <div className={styles.header}>
        <h2 className={styles.title}>Asset</h2>
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
          <dd>{asset.role === "patrol" ? "Patrol" : "Traffic"}</dd>
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
        <div className={styles.row}>
          <dt>Threat</dt>
          <dd style={{ color: threatColor }}>{formatThreat(asset.threat)}</dd>
        </div>
        <div className={styles.row}>
          <dt>TTE</dt>
          <dd style={{ color: threatColor }}>{formatTte(asset)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Nearest zone</dt>
          <dd>{formatDistanceM(asset.nearestZoneDistanceM)}</dd>
        </div>
      </dl>
    </aside>
  );
}
