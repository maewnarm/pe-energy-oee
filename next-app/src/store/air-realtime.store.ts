import create from 'zustand'
import BaseEnergyStoreInitializer from './base-energy-visualize.store'
import { IEnergyVisualizeState } from './interface/energy-visualize.interface'

export const AirRealtimeStore = create<IEnergyVisualizeState>(BaseEnergyStoreInitializer)
