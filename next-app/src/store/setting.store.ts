import create from 'zustand'
import moment from 'moment'
import { ISettingState } from './interface/setting.interface'

export const SettingStore = create<ISettingState>((set, get) => ({
  productMapToLineRecord: {},

  selectedProduct: '',
  selectedProductLine: '',
  selectedDate: '',

  productList () {
    return Object.keys(get().productMapToLineRecord)
  },
  productLineList () {
    return get().productMapToLineRecord?.[get().selectedProduct] ?? []
  },

  setProductMapToLineRecord(productMapToLineRecord: Record<string, string[]>) {
    set({ productMapToLineRecord })
    get().resetSelectionState()
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