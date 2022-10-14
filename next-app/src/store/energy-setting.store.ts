import create from 'zustand'
import moment from 'moment'
import { IEnergySettingState } from './interface/energy-setting.interface'

export const EnergySettingStore = create<IEnergySettingState>((set, get) => ({
  productMapToLineRecord: {},

  selectedProduct: '',
  selectedProductLine: '',
  selectedDate: moment().format('YYYY-MM-DD'),

  productList () {
    return Object.keys(get().productMapToLineRecord)
  },
  productLineList () {
    return get().productMapToLineRecord?.[get().selectedProduct] ?? []
  },

  setProductMapToLineRecord(productMapToLineRecord: Record<string, string[]>) {
    set({ productMapToLineRecord })
  },
  setSelectedProduct(selectedProduct: string) {
    set({ selectedProduct })
  },
  setSelectedProductLine(selectedProductLine: string) {
    set({ selectedProductLine })
  },
  setSelectedDate(selectedDate: string) {
    set({ selectedDate })
  },

  resetSelectionState () {
    set({
      selectedProduct: get().productList()?.[0] ?? '',
      selectedProductLine: get().productMapToLineRecord?.[get().productList()?.[0]]?.[0] ?? '',
      selectedDate: moment().format('YYYY-MM-DD')
    })
  }
}))