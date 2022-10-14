import axiosInstance from '@/lib/axios'
import { AxiosRequestConfig } from 'axios'
import { EnergyResponse } from '@/types/electric.type'
import util from '@/util'
import { AirMonthlyStore, ElectricMonthlyStore } from '@/store'

export async function fetchElectricMonthly(product: string, line: string, date: Date | string, config?: AxiosRequestConfig): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } = ElectricMonthlyStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: line,
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<EnergyResponse>(`energy/monthly?${serializedQuery}`, config)

  setXAxisList(data.x_axis)
  setYAxisList(data.y_axis)
  setNameMap(data.mc_map)
  setTotal(data.total)

  return data
}

export async function fetchAirMonthly(product: string, line: string, date: Date | string, config?: AxiosRequestConfig): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } = AirMonthlyStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: line,
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<EnergyResponse>(`air/monthly?${serializedQuery}`, config)

  setXAxisList(data.x_axis)
  setYAxisList(data.y_axis)
  setNameMap(data.mc_map)
  setTotal(data.total)

  return data
}
