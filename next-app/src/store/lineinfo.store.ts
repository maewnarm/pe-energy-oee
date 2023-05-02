import { create } from "zustand";
import { ILineInfoState } from "./interface/lineinfo.interface";

export const LineInfoStore = create<ILineInfoState>((set, get) => ({
  prodVolumePlan: [],
  prodVolumeActual: [],

  setProdVolumePlan(prodVolumePlan) {
    set({ prodVolumePlan });
  },
  setProdVolumeActual(prodVolumeActual) {
    set({ prodVolumeActual });
  },
}));
