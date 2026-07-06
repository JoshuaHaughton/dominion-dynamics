import { create } from "zustand";
import type {
  OperationsEntityTab,
  OperationsStatusFilter,
} from "../utils/assetSymbology.js";

type OperationsState = {
  selectedAssetId: string | null;
  isFollowingCamera: boolean;
  entityTab: OperationsEntityTab;
  statusFilter: OperationsStatusFilter;
  selectAsset: (assetId: string | null) => void;
  setFollowingCamera: (isFollowing: boolean) => void;
  setEntityTab: (entityTab: OperationsEntityTab) => void;
  setStatusFilter: (statusFilter: OperationsStatusFilter) => void;
};

/** Live map selection, follow mode, and operations panel filters. */
export const useOperationsStore = create<OperationsState>((set) => ({
  selectedAssetId: null,
  isFollowingCamera: false,
  entityTab: "missions",
  statusFilter: "all",
  selectAsset: (selectedAssetId) => set({ selectedAssetId }),
  setFollowingCamera: (isFollowingCamera) => set({ isFollowingCamera }),
  setEntityTab: (entityTab) => set({ entityTab, statusFilter: "all" }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}));
