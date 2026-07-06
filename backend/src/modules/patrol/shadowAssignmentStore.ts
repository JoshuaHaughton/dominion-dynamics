/** Maps a critical traffic asset id to the patrol drone shadowing it. */
const shadowAssignments = new Map<string, string>();

/** Read which drone is shadowing a traffic asset, if any. */
export function getShadowDroneId(targetAssetId: string): string | undefined {
  return shadowAssignments.get(targetAssetId);
}

/**
 * Record that a drone is shadowing a target.
 * Returns false when another drone already shadows that target.
 */
export function setShadowAssignment(
  targetAssetId: string,
  droneId: string,
): boolean {
  const existing = shadowAssignments.get(targetAssetId);

  if (existing !== undefined && existing !== droneId) {
    return false;
  }

  shadowAssignments.set(targetAssetId, droneId);
  return true;
}

/** Clear shadow ownership when a drone stops shadowing a target. */
export function deleteShadowAssignment(targetAssetId: string): void {
  shadowAssignments.delete(targetAssetId);
}

/** Clear all shadow assignments (tests / shutdown). */
export function clearShadowAssignments(): void {
  shadowAssignments.clear();
}
