import { create } from "zustand";
import { IFactoryEnergyState } from "./interface/factory-energy.interface";

export const FactoryEnergyStore = create<IFactoryEnergyState>((set, get) => ({
  factoryData: [],

  setFactoryData(factoryData) {
    set({ factoryData });
  },
}));
