export type ProdVolumeResponse = {
  SectionCode: string;
  WorkCenterCode: string;
  LineCode: string;
  LineName: string;
  PlanData: Date;
  ProdPlan: number;
  ProdActual: number;
};

export type ProdVolumePlanActual = {
  ProdPlan: number[];
  ProdActual: number[];
};
