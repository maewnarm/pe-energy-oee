import { MACHINE_UNIT_SELECTION_TO_VALUE } from '@/constants/chart'
import axiosInstance from '@/lib/axios'
import { OEEDashboardStore } from '@/store/oee-dashboard.store'
import { OEECycleTimeResponse, OEEFaultOccurrenceResponse, OEEProductionResponse } from '@/types/oee-dashboard.type'
import util from '@/util'
import { AxiosRequestConfig } from 'axios'

export async function fetchOEEProduction(product: string, productLine: string, date: string, period: string, config?: AxiosRequestConfig): Promise<OEEProductionResponse> {
  const { setProduction, setDekidakaList } = OEEDashboardStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: productLine,
    date: dateObj.getDate(),
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
    period: period
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<OEEProductionResponse>(`oee/production?${serializedQuery}`, config)

  setProduction({
    denominator: data.denominator,
    numerator: data.numerator,
    percent: data.percent
  })

  setDekidakaList(data.dekidaka)

  return data
}

export async function fetchOEECycleTime(product: string, productLine: string, date: string, period: string, operator: string, config?: AxiosRequestConfig): Promise<OEECycleTimeResponse> {
  const { setCycleTime } = OEEDashboardStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: productLine,
    date: dateObj.getDate(),
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
    operator: operator,
    period: period
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<OEECycleTimeResponse>(`oee/cycle_time?${serializedQuery}`, config)

  setCycleTime(data)

  return data
}

export async function fetchOEEFaultOccurrence(product: string, productLine: string, date: string, period: string, machine: string, mode: string,config?: AxiosRequestConfig): Promise<OEEFaultOccurrenceResponse> {
  const { setFaultOccurrence } = OEEDashboardStore.getState()
  const dateObj = new Date(date)
  const query = {
    product: product,
    line: productLine,
    date: dateObj.getDate(),
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
    machine: machine,
    period: period,
    mode: MACHINE_UNIT_SELECTION_TO_VALUE[mode]
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<OEEFaultOccurrenceResponse>(`oee/fault_occurrence?${serializedQuery}`, config)

  setFaultOccurrence(data)

  return data
}