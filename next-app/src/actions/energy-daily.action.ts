import axiosInstance from "@/lib/axios";
import { AirDailyStore, ElectricDailyStore } from "@/store";
import { CommonStore } from "@/store/common.store";
import { EnergyResponse } from "@/types/electric.type";
import util from "@/util";
import { AxiosRequestConfig } from "axios";

export async function fetchElectricDaily(
  product: string,
  line: string,
  date: Date | string,
  config?: AxiosRequestConfig
): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } =
    ElectricDailyStore.getState();
  const setIsLoading = CommonStore.getState().setIsLoading;
  const dateObj = new Date(date);
  const query = {
    product: product,
    line: line,
    date: dateObj.getDate(),
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  };
  const serializedQuery = util.serializeQuery(query);
  setIsLoading(true);
  const { data } = await axiosInstance.get<EnergyResponse>(
    `energy/daily?${serializedQuery}`,
    config
  );

  setXAxisList(data.x_axis);
  setYAxisList(data.y_axis);
  setNameMap(data.mc_map);
  setTotal(data.total);

  setIsLoading(false);

  return data;
}

export async function fetchAirDaily(
  product: string,
  line: string,
  date: Date | string,
  config?: AxiosRequestConfig
): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } =
    AirDailyStore.getState();
  const setIsLoading = CommonStore.getState().setIsLoading;
  const dateObj = new Date(date);
  const query = {
    product: product,
    line: line,
    date: dateObj.getDate(),
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  };
  const serializedQuery = util.serializeQuery(query);
  setIsLoading(true);
  const { data } = await axiosInstance.get<EnergyResponse>(
    `air/daily?${serializedQuery}`,
    config
  );

  setXAxisList(data.x_axis);
  setYAxisList(data.y_axis);
  setNameMap(data.mc_map);
  setTotal(data.total);

  setIsLoading(false);

  return data;
}
