import { FactoryEnergyData } from "@/types/energy.type";

export interface IFactoryEnergyState {
  factoryData: FactoryEnergyData[];

  setFactoryData: (factoryData: FactoryEnergyData[]) => void;
}
