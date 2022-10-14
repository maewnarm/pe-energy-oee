import axiosInstance from '@/lib/axios'
import { SettingStore } from '@/store'
import { SettingResponse } from '@/types/setting.type'
import { AxiosRequestConfig } from 'axios'

export async function fetchSetting(config?: AxiosRequestConfig):Promise<SettingResponse> {
  const { setProductMapToLineRecord } = SettingStore.getState()
  const { data } = await axiosInstance.get<SettingResponse>('setting/energy_filter_setting', config)

  setProductMapToLineRecord(data.product_to_line_list)

  return data
}
