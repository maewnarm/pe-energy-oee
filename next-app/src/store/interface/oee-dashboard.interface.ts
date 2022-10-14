import { OEECycleTime, OEEDekidakaItem, OEEFaultOccurrence, OEEProduction } from '@/types/oee-dashboard.type'

export interface IOEEDashbaordState {
  production?: OEEProduction
  dekidakaList: OEEDekidakaItem[]
  cycleTime?: OEECycleTime
  faultOccurrence?: OEEFaultOccurrence

  setProduction: (production: OEEProduction) => void
  setDekidakaList: (dekidakaList: OEEDekidakaItem[]) => void
  setCycleTime: (cycleTime: OEECycleTime) => void
  setFaultOccurrence: (faultOccurrence: OEEFaultOccurrence) => void
}