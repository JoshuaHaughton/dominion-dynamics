import { useEffect } from "react";

type UseMapKeyboardShortcutsInput = {
  selectedAssetId: string | null;
  isFollowingCamera: boolean;
  selectAsset: (assetId: string | null) => void;
  setFollowingCamera: (isFollowing: boolean) => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;

  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

/** Esc deselects; F toggles camera follow on the selected asset. */
export function useMapKeyboardShortcuts({
  selectedAssetId,
  isFollowingCamera,
  selectAsset,
  setFollowingCamera,
}: UseMapKeyboardShortcutsInput): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        if (selectedAssetId === null) {
          return;
        }

        setFollowingCamera(false);
        selectAsset(null);
        return;
      }

      if (event.key.toLowerCase() !== "f") {
        return;
      }

      if (selectedAssetId === null) {
        return;
      }

      event.preventDefault();
      setFollowingCamera(!isFollowingCamera);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    isFollowingCamera,
    selectAsset,
    selectedAssetId,
    setFollowingCamera,
  ]);
}
