import axiosInstance from "@/lib/axios";
import axiosInstanceTest from "@/lib/axiosTest";
import { AirMonthlyStore, ElectricMonthlyStore } from "@/store";
import { CommonStore } from "@/store/common.store";
import { LineInfoStore } from "@/store/lineinfo.store";
import {
  ProdVolumePlanActual,
  ProdVolumeResponse,
} from "@/types/lineinfo.types";
import util from "@/util";
import { AxiosRequestConfig } from "axios";

export async function fetchProductVolumeMonthly(
  product: string,
  line: string,
  date: Date | string,
  config?: AxiosRequestConfig
): Promise<ProdVolumePlanActual> {
  const { setProdVolumePlan, setProdVolumeActual } = LineInfoStore.getState();
  const dateObj = new Date(date);
  const query = {
    product: product,
    line: line,
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  };
  const serializedQuery = util.serializeQuery(query);
  // option use axiosInstanceTest
  const { data } = await axiosInstance.get<ProdVolumeResponse[]>(
    `lineinfo/linemonth?${serializedQuery}`,
    config
  );

  let plan: number[] = [];
  let actual: number[] = [];

  data.forEach((d) => {
    plan.push(d.ProdPlan);
    actual.push(d.ProdActual);
  });

  setProdVolumePlan(plan);
  setProdVolumeActual(actual);

  const volumeData = {
    ProdPlan: plan,
    ProdActual: actual,
  };

  return volumeData;
}
