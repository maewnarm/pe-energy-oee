export type EnergyResponse = {
  total: number
  x_axis: string[]
  y_axis: Array<Record<string, string>>
  mc_map: Record<string, string>
}

export type EnergyRealtimeRaceResponse = {
  "x-axis": string
  "y-axis": string
}

export type EnergyRealtimeResponse = {
  line: EnergyResponse,
  race: EnergyRealtimeRaceResponse[]
}
