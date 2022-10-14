export type OEEProductSettingResponse = {
	product_to_line_list: Record<string, string[]>
  period_list: string[]
}

export type OEEOperatorSettingResponse = {
  operator_list: string[]
}

export type OEEMachineSettingResponse = {
  machine_list: string[]
}
