import { create } from "zustand";
import BaseEnergyRealtimeRaceStore from "./base-energy-realtime-race.store";
import { IEnergyRaceVisualizeState } from "./interface/energy-race-visualize.interface";

export const AirRealtimeRaceStore = create<IEnergyRaceVisualizeState>(
  BaseEnergyRealtimeRaceStore
);
