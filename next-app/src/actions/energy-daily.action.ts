import axiosInstance from '@/lib/axios'
import { AxiosRequestConfig } from 'axios'
import { EnergyResponse } from '@/types/electric.type'
import { AirDailyStore, ElectricDailyStore } from '@/store'
import util from '@/util'

export async function fetchElectricDaily(product: string, line: string, date: Date | string, config?: AxiosRequestConfig): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } = ElectricDailyStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: line,
    date: dateObj.getDate(),
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<EnergyResponse>(`energy/daily?${serializedQuery}`, config)

  setXAxisList(data.x_axis)
  setYAxisList(data.y_axis)
  setNameMap(data.mc_map)
  setTotal(data.total)

  return data
}

export async function fetchAirDaily(product: string, line: string, date: Date | string, config?: AxiosRequestConfig): Promise<EnergyResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } = AirDailyStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: line,
    date: dateObj.getDate(),
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<EnergyResponse>(`air/daily?${serializedQuery}`, config)

  setXAxisList(data.x_axis)
  setYAxisList(data.y_axis)
  setNameMap(data.mc_map)
  setTotal(data.total)

  return data
}
