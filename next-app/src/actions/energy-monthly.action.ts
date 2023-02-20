import axiosInstance from "@/lib/axios";
import { AirMonthlyStore, ElectricMonthlyStore } from "@/store";
import { CommonStore } from "@/store/common.store";
import { EnergyResponse } from "@/types/electric.type";
import util from "@/util";
import { AxiosRequestConfig } from "axios";

export async function fetchElectricMonthly(
  product: string,
  line: string,
  date: Date | string,
  config?: AxiosRequestConfig
): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } =
    ElectricMonthlyStore.getState();
  const setIsLoading = CommonStore.getState().setIsLoading;
  const dateObj = new Date(date);
  const query = {
    product: product,
    line: line,
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  };
  const serializedQuery = util.serializeQuery(query);
  setIsLoading(true);
  const { data } = await axiosInstance.get<EnergyResponse>(
    `energy/monthly?${serializedQuery}`,
    config
  );

  setXAxisList(data.x_axis);
  setYAxisList(data.y_axis);
  setNameMap(data.mc_map);
  setTotal(data.total);

  setIsLoading(false);

  return data;
}

export async function fetchAirMonthly(
  product: string,
  line: string,
  date: Date | string,
  config?: AxiosRequestConfig
): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } =
    AirMonthlyStore.getState();
  const setIsLoading = CommonStore.getState().setIsLoading;
  const dateObj = new Date(date);
  const query = {
    product: product,
    line: line,
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  };
  const serializedQuery = util.serializeQuery(query);
  setIsLoading(true);
  const { data } = await axiosInstance.get<EnergyResponse>(
    `air/monthly?${serializedQuery}`,
    config
  );

  setXAxisList(data.x_axis);
  setYAxisList(data.y_axis);
  setNameMap(data.mc_map);
  setTotal(data.total);

  setIsLoading(false);

  return data;
}
