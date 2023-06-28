import axiosInstance from "@/lib/axios";
import axiosInstanceTest from "@/lib/axiosTest";
import {
  AirMonthlyStore,
  ElectricMonthlyStore,
  FactoryEnergyStore,
} from "@/store";
import { CommonStore } from "@/store/common.store";
import { LineInfoStore } from "@/store/lineinfo.store";
import { FactoryEnergyData } from "@/types/energy.type";
import {
  ProdVolumePlanActual,
  ProdVolumeResponse,
} from "@/types/lineinfo.types";
import util from "@/util";
import { AxiosRequestConfig } from "axios";

export async function fetchEnergyFactoryDay(
  product: string,
  line: string,
  date: Date | string,
  config?: AxiosRequestConfig
): Promise<FactoryEnergyData[]> {
  const { setFactoryData } = FactoryEnergyStore.getState();
  const dateObj = new Date(date);
  const query = {
    product: product,
    line: line,
    year: dateObj.getFullYear(),
    month: dateObj.getMonth() + 1,
    day: dateObj.getDate(),
  };
  const serializedQuery = util.serializeQuery(query);
  // optional use axiosInstanceTest
  const { data } = await axiosInstance.get<FactoryEnergyData[]>(
    `factorye/lineday?${serializedQuery}`,
    config
  );

  setFactoryData(data);

  return data;
}
