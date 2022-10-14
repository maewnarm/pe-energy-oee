import axiosInstance from '@/lib/axios'
import { AxiosRequestConfig } from 'axios'
import { EnergyRealtimeResponse, EnergyResponse } from '@/types/electric.type'
import util from '@/util'
import { AirRealtimeStore, ElectricRealtimeStore } from '@/store'
import { ElectricRealtimeRaceStore } from '@/store/electric-realtime-race.store'
import { AirRealtimeRaceStore } from '@/store/air-realtime-race.store'

export async function fetchElectricRealtime(product: string, line: string, paddingSecs: number, latestMins: number, config?: AxiosRequestConfig): Promise<EnergyRealtimeResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } = ElectricRealtimeStore.getState()
  const raceState = ElectricRealtimeRaceStore.getState()
  const query = {
    product: product,
    line: line,
    padding_secs: paddingSecs,
    latest_mins: latestMins
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<EnergyRealtimeResponse>(`energy/realtime?${serializedQuery}`, config)

  setXAxisList(data.line.x_axis)
  setYAxisList(data.line.y_axis)
  setNameMap(data.line.mc_map)
  setTotal(data.line.total)

  raceState.setXAxisList(data.race.map(r => r['x-axis']))
  raceState.setYAxisList(data.race.map(r => +r['y-axis']))

  return data
}

export async function fetchAirRealtime(product: string, line: string, paddingSecs: number, latestMins: number, config?: AxiosRequestConfig): Promise<EnergyRealtimeResponse> {
  const { setNameMap, setTotal, setXAxisList, setYAxisList } = AirRealtimeStore.getState()
  const raceState = AirRealtimeRaceStore.getState()

  const query = {
    product: product,
    line: line,
    padding_secs: paddingSecs,
    latest_mins: latestMins
  }
  const serializedQuery = util.serializeQuery(query)
  const { data } = await axiosInstance.get<EnergyRealtimeResponse>(`air/realtime?${serializedQuery}`, config)

  setXAxisList(data.line.x_axis)
  setYAxisList(data.line.y_axis)
  setNameMap(data.line.mc_map)
  setTotal(data.line.total)
  
  raceState.setXAxisList(data.race.map(r => r['x-axis']))
  raceState.setYAxisList(data.race.map(r => +r['y-axis']))

  return data
}
