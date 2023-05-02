export interface ILineInfoState {
  prodVolumePlan: number[];
  prodVolumeActual: number[];

  setProdVolumePlan: (prodVolumePlan: number[]) => void;
  setProdVolumeActual: (prodVolumeActual: number[]) => void;
}
