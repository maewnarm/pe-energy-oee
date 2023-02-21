export interface IEnergyVisualizeState {
  xAxisList: string[];
  yAxisList: Array<Record<string, string>>;
  total: number;
  nameMap: Record<string, string>;
  infoNameMap: Record<string, Array<Record<string, string>>>;

  setXAxisList: (value: string[]) => void;
  setYAxisList: (value: Array<Record<string, string>>) => void;
  setTotal: (value: number) => void;
  setNameMap: (value: Record<string, string>) => void;
  setInfoNameMap: (
    value: Record<string, Array<Record<string, string>>>
  ) => void;
}
