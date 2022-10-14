export interface IOEESettingState {
	productMapToLineRecord: Record<string, string[]>
  periodList: string[]
  operatorList: string[]
  machineList: string[]

  selectedProduct: string
  selectedProductLine: string
  selectedDate: string
  selectedPeriod: string

  selectedOperator: string
  selectedMachine: string
  selectedMachineUnit: string

  productList: () => string[]
  productLineList: () => string[]

  setProductSelectionList: (productMaptoLineRecord: Record<string, string[]>, periodList: string[]) => void
  setOperatorList: (operatorList: string[]) => void
  setMachineList: (machineList: string[]) => void

  setSelectedProduct: (product: string) => void
  setSelectedProductLine: (productLine: string) => void
  setSelectedDate: (date: string) => void
  setSelectedPeriod: (period: string) => void
  setSelectedOperator: (operator: string) => void
  setSelectedMachine: (machine: string) => void
  setSelectedMachineUnit: (unit: string) => void

  resetProductSelectionState: () => void
  resetOperatorSelectionState: () => void
  resetMachineSelectionState: () => void
}