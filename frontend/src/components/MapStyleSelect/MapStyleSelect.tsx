import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { listMapStyleOptions } from "../../lib/constants/mapStyleUtils.js";
import styles from "./MapStyleSelect.module.css";

type MapStyleSelectProps = {
  value: MapStyleId;
  onChange: (styleId: MapStyleId) => void;
};

/** Dropdown of all catalogued free basemap styles. */
export function MapStyleSelect({ value, onChange }: MapStyleSelectProps) {
  return (
    <label className={styles.root}>
      <span className={styles.label}>Basemap</span>
      <select
        className={styles.select}
        value={value}
        onChange={(event) => {
          onChange(event.target.value as MapStyleId);
        }}
      >
        {listMapStyleOptions().map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
