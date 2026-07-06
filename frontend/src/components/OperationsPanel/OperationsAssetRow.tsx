import dlStyles from "../../styles/dlGrid.module.css";
import styles from "./OperationsPanel.module.css";

export type AssetRowField = {
  label: string;
  value: string;
  /** Optional value tint, e.g. threat colors on traffic rows. */
  valueClassName?: string | undefined;
};

type OperationsAssetRowProps = {
  assetId: string;
  fields: readonly AssetRowField[];
  isSelected: boolean;
  isPinned?: boolean;
  onSelect: (assetId: string) => void;
};

/** One selectable asset row; mission/drone/traffic variants differ only in fields. */
export function OperationsAssetRow({
  assetId,
  fields,
  isSelected,
  isPinned = false,
  onSelect,
}: OperationsAssetRowProps) {
  const rowClasses = [
    styles.rowButton,
    isPinned ? styles.pinnedRow : "",
    isSelected ? styles.rowButtonSelected : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li>
      <button
        type="button"
        className={rowClasses}
        aria-pressed={isSelected}
        onClick={() => {
          onSelect(assetId);
        }}
      >
        <span className={styles.rowGrid}>
          {fields.map((field) => (
            <span key={field.label}>
              <span className={dlStyles.dlLabel}>{field.label}</span>
              <span
                className={`${dlStyles.dlValue} ${field.valueClassName ?? ""}`}
              >
                {field.value}
              </span>
            </span>
          ))}
        </span>
      </button>
    </li>
  );
}
