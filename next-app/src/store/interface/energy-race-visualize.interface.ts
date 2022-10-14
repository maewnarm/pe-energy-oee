export interface IEnergyRaceVisualizeState {
  xAxisList: string[]
  yAxisList: number[]

  setXAxisList: (value: string[]) => void
  setYAxisList: (value: number[]) => void 
}