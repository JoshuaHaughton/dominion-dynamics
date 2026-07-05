import type {
  Asset,
  AssetTrackDetail,
  SelectedTrackDelta,
  SnapshotMessage,
} from "@dominion-dynamics/shared";

type BuildSnapshotMessageParams = {
  assets: Asset[];
  ts?: number;
  selectedTrack?: AssetTrackDetail;
  selectedTrackDelta?: SelectedTrackDelta;
};

/** Build a snapshot payload from the current in-memory asset list. */
export function buildSnapshotMessage({
  assets,
  ts = Date.now(),
  selectedTrack,
  selectedTrackDelta,
}: BuildSnapshotMessageParams): SnapshotMessage {
  return {
    type: "snapshot",
    ts,
    assets,
    ...(selectedTrack ? { selectedTrack } : {}),
    ...(selectedTrackDelta ? { selectedTrackDelta } : {}),
  };
}
