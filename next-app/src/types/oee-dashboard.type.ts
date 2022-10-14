export type OEEDekidakaItem = {
	period: string
  volumePerHr: number
  plan: number
  accPlan: number
  percent: number
}

export type OEEProduction = {
  numerator: number,
  denominator: number,
  percent: string
}

export type OEECycleTime = {
  has_video: boolean[],
  video_url: string[],
  x_axis: string[],
  y_axis: string[],
  target: number 
}

export type OEEFaultOccurrence = {
  mc_number_list_all: string[]
  mc_number_list_top_10: string[]
  mc_number_list_top_20: string[]
  x_axis_all: string[]
  x_axis_top_10: string[]
  x_axis_top_20: string[]
  y_axis_left_top_10: string[]
  y_axis_left_top_20: string[]
  y_axis_left_all: string[]
  y_axis_right_top_10: string[]
  y_axis_right_top_20: string[]
  y_axis_right_all: string[]
}

export type OEEProductionResponse = OEEProduction & {
  dekidaka: OEEDekidakaItem[]
}

export type OEECycleTimeResponse = OEECycleTime

export type OEEFaultOccurrenceResponse = OEEFaultOccurrence
