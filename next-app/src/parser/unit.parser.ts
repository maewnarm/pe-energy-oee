export function ConvertkWhToW(kwh: number): [number, string, string] {
  return [kwh * 1000, 'kWh', 'W']
}

export function ConvertkWhTokgCO2e(kwh: number): [number, string, string] {
  return [kwh * 0.595, 'kWh', 'kgCO2e']
}

export function ConvertkWhTotCO2e(kwh: number): [number, string, string] {
  return [kwh * (0.0595 * 0.001), 'kWh', 'tCO2e']
}

export function Convertm3TokgCO2e(m3: number): [number, string, string] {
  return [m3 * 0.0765, 'm3', 'kgCO2e']
}

export function Convertm3TotCO2e(m3: number): [number, string, string] {
  return [m3 * (0.0765 * 0.001), 'm3', 'tCO2e']
}
