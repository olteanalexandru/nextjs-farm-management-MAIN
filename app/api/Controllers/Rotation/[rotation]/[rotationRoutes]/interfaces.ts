export interface CropInput {
  id: number;
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
  ItShouldNotBeRepeatedForXYears: number;
  plantingDate: string;
  harvestingDate: string;
}

export interface RotationInput {
  fieldSize: number;
  numberOfDivisions: number;
  rotationName: string;
  crops: CropInput[];
  maxYears: number;
  ResidualNitrogenSupply?: number;
}

export interface RouteContext {
  params: {
    rotation: string;
    rotationRoutes: string;
    dinamicAction: string;
  };
}
