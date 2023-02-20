import axiosInstance from "@/lib/axios";
import { AirYearlyStore, ElectricYearlyStore } from "@/store";
import { CommonStore } from "@/store/common.store";
import { EnergyResponse } from "@/types/electric.type";
import util from "@/util";
import { AxiosRequestConfig } from "axios";

export async function fetchElectricYearly(
  product: string,
  line: string,
  date: Date | string,
  config?: AxiosRequestConfig
): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } =
    ElectricYearlyStore.getState();
  const setIsLoading = CommonStore.getState().setIsLoading;
  const dateObj = new Date(date);
  const query = {
    product: product,
    line: line,
    year: dateObj.getFullYear(),
  };
  const serializedQuery = util.serializeQuery(query);
  setIsLoading(true);
  const { data } = await axiosInstance.get<EnergyResponse>(
    `energy/yearly?${serializedQuery}`,
    config
  );

  setXAxisList(data.x_axis);
  setYAxisList(data.y_axis);
  setNameMap(data.mc_map);
  setTotal(data.total);

  setIsLoading(false);

  return data;
}

export async function fetchAirYearly(
  product: string,
  line: string,
  date: Date | string,
  config?: AxiosRequestConfig
): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } =
    AirYearlyStore.getState();
  const setIsLoading = CommonStore.getState().setIsLoading;
  const dateObj = new Date(date);
  const query = {
    product: product,
    line: line,
    year: dateObj.getFullYear(),
  };
  const serializedQuery = util.serializeQuery(query);
  setIsLoading(true);
  const { data } = await axiosInstance.get<EnergyResponse>(
    `air/yearly?${serializedQuery}`,
    config
  );

  setXAxisList(data.x_axis);
  setYAxisList(data.y_axis);
  setNameMap(data.mc_map);
  setTotal(data.total);

  setIsLoading(false);

  return data;
}
