import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { isMapStyleId } from "../../lib/constants/mapStyles.js";
import { listMapStyleOptions } from "./mapStylePrefs.js";
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
          if (isMapStyleId(event.target.value)) {
            onChange(event.target.value);
          }
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
