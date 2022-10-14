import { StateCreator } from 'zustand'
import { IEnergyRaceVisualizeState } from './interface/energy-race-visualize.interface'

const BaseEnergyRealtimeRaceStore: StateCreator<IEnergyRaceVisualizeState> = (set, get) => ({
  xAxisList: [],
  yAxisList: [],

  setXAxisList: (xAxisList: string[]) => {
    set({ xAxisList })
  },

  setYAxisList: (yAxisList: number[]) => {
    set({ yAxisList })
  }
})

export default BaseEnergyRealtimeRaceStore
