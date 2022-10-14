import axiosInstance from '@/lib/axios'
import { OEESettingStore } from '@/store/oee-setting.store'
import { OEEProductSettingResponse, OEEOperatorSettingResponse, OEEMachineSettingResponse } from '@/types/oee-setting.type'
import util from '@/util'
import { AxiosRequestConfig } from 'axios'

export async function fetchOEEProductSetting(config?: AxiosRequestConfig): Promise<OEEProductSettingResponse> {
  const { setProductSelectionList, resetProductSelectionState } = OEESettingStore.getState()
  const { data } = await axiosInstance.get<OEEProductSettingResponse>('setting/oee_filter_setting', config)

  setProductSelectionList(data.product_to_line_list, data.period_list)
  resetProductSelectionState()
  
  return data
}

export async function fetchOEEOperatorSetting(product:string, productLine: string, config?: AxiosRequestConfig): Promise<OEEOperatorSettingResponse> {
  const { selectedOperator, setOperatorList, resetOperatorSelectionState } = OEESettingStore.getState()
  const query = {
    product: product,
    line: productLine
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<OEEOperatorSettingResponse>(`setting/oee_operators?${serializedQuery}`, config)

  setOperatorList(data.operator_list)

  if (selectedOperator === '') {
    resetOperatorSelectionState()
  }

  return data
}

export async function fetchOEEMachineSetting(product: string, productLine: string, config?: AxiosRequestConfig): Promise<OEEMachineSettingResponse> {
  const { selectedMachine, setMachineList, resetMachineSelectionState } = OEESettingStore.getState()
  const query = {
    product: product,
    line: productLine
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<OEEMachineSettingResponse>(`setting/oee_machines?${serializedQuery}`, config)

  setMachineList(data.machine_list)

  if (selectedMachine === '') {
    resetMachineSelectionState()
  }

  return data
}
