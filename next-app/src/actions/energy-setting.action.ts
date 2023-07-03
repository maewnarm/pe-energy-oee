import axiosInstance from "@/lib/axios";
import axiosInstanceTest from "@/lib/axiosTest";
import { EnergySettingStore } from "@/store";
import { EnergySettingResponse } from "@/types/energy-setting.type";
import { AxiosRequestConfig } from "axios";

export async function fetchEnergySetting(
  config?: AxiosRequestConfig
): Promise<EnergySettingResponse> {
  const { setProductMapToLineRecord, resetSelectionState } =
    EnergySettingStore.getState();
  // option use axiosInstanceTest
  const { data } = await axiosInstance.get<EnergySettingResponse>(
    "setting/energy_filter_setting",
    config
  );

  setProductMapToLineRecord(data.product_to_line_list);
  resetSelectionState();

  return data;
}
