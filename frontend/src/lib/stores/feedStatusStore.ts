import { create } from "zustand";

type FeedStatusState = {
  connected: boolean;
  lastUpdatedAt: number | null;
  setConnected: (connected: boolean) => void;
  setLastUpdatedAt: (lastUpdatedAt: number) => void;
  reset: () => void;
};

/**
 * Live WS feed health. Written by useLiveAssets (inside LiveMap), read by the
 * header FeedStatus pill and the map loading gate — keeps the 1 Hz snapshot
 * stream from re-rendering the whole App tree.
 */
export const useFeedStatusStore = create<FeedStatusState>((set) => ({
  connected: false,
  lastUpdatedAt: null,
  setConnected: (connected) => set({ connected }),
  setLastUpdatedAt: (lastUpdatedAt) => set({ lastUpdatedAt }),
  reset: () => set({ connected: false, lastUpdatedAt: null }),
}));
