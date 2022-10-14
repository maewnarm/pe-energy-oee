import create from 'zustand'
import moment from 'moment'
import { IOEESettingState } from './interface/oee-setting.interface'

export const OEESettingStore = create<IOEESettingState>((set, get) => ({
  productMapToLineRecord: {},
  operatorList: [],
  machineList: [],
  periodList: [],

  selectedProduct: '',
  selectedProductLine: '',
  selectedDate: moment().format('YYYY-MM-DD'),
  selectedPeriod: '',
  selectedOperator: '',
  selectedMachine: '',
  selectedMachineUnit: 'Times secs.',

  productList() {
    return Object.keys(get().productMapToLineRecord)
  },
  productLineList() {
    return get().productMapToLineRecord?.[get().selectedProduct] ?? []
  },

  setProductSelectionList(productMapToLineRecord: Record<string, string[]>, periodList: string[]) {
    set({
      productMapToLineRecord,
      periodList
    })
  },
  setOperatorList(operatorList: string[]) {
    set({ operatorList })
  },
  setMachineList(machineList: string[]) {
    set({ machineList })
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
  setSelectedPeriod(selectedPeriod: string) {
    set({ selectedPeriod })
  },
  setSelectedOperator(selectedOperator: string) {
    set({ selectedOperator })
  },
  setSelectedMachine(selectedMachine: string) {
    set({ selectedMachine })
  },

  setSelectedMachineUnit(selectedMachineUnit: string) {
    set({ selectedMachineUnit })
  },

  resetProductSelectionState() {
    set({
      selectedProduct: get().productList()?.[0] ?? '',
      selectedProductLine: get().productMapToLineRecord?.[get().productList()?.[0]]?.[0] ?? '',
      selectedDate: moment().format('YYYY-MM-DD'),
      selectedPeriod: get().periodList?.[0] ?? ''
    })
  },

  resetOperatorSelectionState() {
    set({
      selectedOperator: get().operatorList?.[0] ?? '',
    })
  },

  resetMachineSelectionState() {
    set({
      selectedMachine: get().machineList?.[0] ?? '',
    })
  },
}))