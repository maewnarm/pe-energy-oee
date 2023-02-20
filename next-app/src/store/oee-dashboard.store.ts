import {
  OEECycleTime,
  OEEDekidakaItem,
  OEEFaultOccurrence,
  OEEProduction,
} from "@/types/oee-dashboard.type";
import { create } from "zustand";
import { IOEEDashbaordState } from "./interface/oee-dashboard.interface";

export const OEEDashboardStore = create<IOEEDashbaordState>((set, get) => ({
  production: undefined,
  cycleTime: undefined,
  faultOccurrence: undefined,
  dekidakaList: [],

  setProduction(production: OEEProduction) {
    set({ production });
  },
  setCycleTime(cycleTime: OEECycleTime) {
    set({ cycleTime });
  },
  setDekidakaList(dekidakaList: OEEDekidakaItem[]) {
    set({ dekidakaList });
  },
  setFaultOccurrence(faultOccurrence: OEEFaultOccurrence) {
    set({ faultOccurrence });
  },
}));
