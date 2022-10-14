import { StateCreator } from 'zustand'
import { IEnergyVisualizeState } from './interface/energy-visualize.interface'

const BaseEnergyStoreInitializer: StateCreator<IEnergyVisualizeState> = (set, get) => ({
  xAxisList: [],
  yAxisList: [],
  total: 0,
  nameMap: {},

  setXAxisList(xAxisList: string[]) {
    set({ xAxisList })
  },
  setYAxisList(yAxisList: Array<Record<string, string>>) {
    set({ yAxisList })
  },
  setTotal(total: number) {
    set({ total })
  },
  setNameMap(nameMap: Record<string, string>) {
    set({ nameMap })
  }
})

export default BaseEnergyStoreInitializer
