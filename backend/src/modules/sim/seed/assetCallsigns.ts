let nextTrackCallsignNumber = 1;

/** Operator label for synthetic traffic tracks (`Track-1`, …). */
export function issueTrackCallsign(): string {
  const callsign = `Track-${nextTrackCallsignNumber}`;
  nextTrackCallsignNumber += 1;
  return callsign;
}

/** Reset counters between test files. */
export function resetAssetCallsignCounters(): void {
  nextTrackCallsignNumber = 1;
}
