export interface ISettingState {
  productMapToLineRecord: Record<string, string[]>

  selectedProduct: string
  selectedProductLine: string
  selectedDate: string

  productList: () => string[]
  productLineList: () => string[]

  setProductMapToLineRecord: (productMapToLineRecord: Record<string, string[]>) => void

  setSelectedProduct: (product: string) => void
  setSelectedProductLine: (productLine: string) => void
  setSelectedDate: (date: string) => void

  resetSelectionState: () => void
}