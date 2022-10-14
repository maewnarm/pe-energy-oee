import axiosInstance from '@/lib/axios'
import { EnergySettingStore } from '@/store'
import { EnergySettingResponse } from '@/types/energy-setting.type'
import { AxiosRequestConfig } from 'axios'

export async function fetchEnergySetting(config?: AxiosRequestConfig):Promise<EnergySettingResponse> {
  const { setProductMapToLineRecord, resetSelectionState } = EnergySettingStore.getState()
  const { data } = await axiosInstance.get<EnergySettingResponse>('setting/energy_filter_setting', config)

  setProductMapToLineRecord(data.product_to_line_list)
  resetSelectionState()

  return data
}
