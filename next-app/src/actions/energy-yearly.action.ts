import axiosInstance from '@/lib/axios'
import { AxiosRequestConfig } from 'axios'
import { EnergyResponse } from '@/types/electric.type'
import { AirYearlyStore, ElectricYearlyStore } from '@/store'
import util from '@/util'

export async function fetchElectricYearly(product: string, line: string, date: Date | string, config?: AxiosRequestConfig): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } = ElectricYearlyStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: line,
    year: dateObj.getFullYear(),
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<EnergyResponse>(`energy/yearly?${serializedQuery}`, config)

  setXAxisList(data.x_axis)
  setYAxisList(data.y_axis)
  setNameMap(data.mc_map)
  setTotal(data.total)

  return data
}

export async function fetchAirYearly(product: string, line: string, date: Date | string, config?: AxiosRequestConfig): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } = AirYearlyStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: line,
    year: dateObj.getFullYear(),
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<EnergyResponse>(`air/yearly?${serializedQuery}`, config)

  setXAxisList(data.x_axis)
  setYAxisList(data.y_axis)
  setNameMap(data.mc_map)
  setTotal(data.total)

  return data
}
