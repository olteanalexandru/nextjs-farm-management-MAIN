import { Decimal } from '@prisma/client/runtime/library';

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

export interface RotationPlanInput {
  year: number;
  division: number;
  cropId: number;
  divisionSize: Decimal;
  nitrogenBalance: Decimal;
}
