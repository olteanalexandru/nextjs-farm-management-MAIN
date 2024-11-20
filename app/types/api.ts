import { Decimal } from '@prisma/client/runtime/library';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  posts?: T[];
  crops?: T[];
  selections?: UserCropSelection[];
  status?: number;
}

export interface Post {
  id: string | number;
  userId: string;
  title: string;
  brief: string | null;
  description: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
    email: string;
  };
}

export interface PostCreate {
  title: string;
  brief: string;
  description: string;
  image?: string;
}

export interface PostUpdate {
  title?: string;
  brief?: string;
  description?: string;
  image?: string;
}

export type DetailType = 'FERTILIZER' | 'PEST' | 'DISEASE';

export interface CropDetail {
  id: number;
  value: string;
  detailType: DetailType;
  cropId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for raw Prisma response
export interface PrismaCropDetail {
  id: number;
  value: string;
  detailType: string;
  cropId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Prisma model (internal use)
export interface CropModel {
  id: number;
  userId: string;
  cropName: string;
  cropType?: string | null;
  cropVariety?: string | null;
  plantingDate?: Date | null;
  harvestingDate?: Date | null;
  description?: string | null;
  imageUrl?: string | null;
  soilType?: string | null;
  climate?: string | null;
  ItShouldNotBeRepeatedForXYears?: number | null;
  nitrogenSupply: Decimal;
  nitrogenDemand: Decimal;
  soilResidualNitrogen?: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  deleted?: Date | null;
  details: PrismaCropDetail[];
}

// Interface for API responses (external use)
export interface Crop {
  id: number;
  userId: string;
  cropName: string;
  cropType?: string | null;
  cropVariety?: string | null;
  plantingDate?: Date | null;
  harvestingDate?: Date | null;
  description?: string | null;
  imageUrl?: string | null;
  soilType?: string | null;
  climate?: string | null;
  ItShouldNotBeRepeatedForXYears?: number | null;
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilResidualNitrogen?: number | null;
  createdAt: Date;
  updatedAt: Date;
  deleted?: Date | null;
  details: CropDetail[];
  fertilizers?: string[];
  pests?: string[];
  diseases?: string[];
}

export interface CropCreate {
  cropName: string;
  cropType?: string;
  cropVariety?: string;
  plantingDate?: string;
  harvestingDate?: string;
  description?: string;
  imageUrl?: string;
  soilType?: string;
  climate?: string;
  ItShouldNotBeRepeatedForXYears?: number;
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilResidualNitrogen?: number;
  fertilizers?: string[];
  pests?: string[];
  diseases?: string[];
}

export interface CropUpdate extends Partial<CropCreate> {}

export interface UserCropSelection {
  id: number;
  userId: string;
  cropId: number;
  selectionCount: number;
  createdAt: Date;
  updatedAt: Date;
  crop?: Crop;
}

export interface CropSelection {
  cropId: number;
  selectare: boolean;
  numSelections: number;
}

// Helper function to validate DetailType
export function isValidDetailType(type: string): type is DetailType {
  return ['FERTILIZER', 'PEST', 'DISEASE'].includes(type);
}

// Helper function to transform Prisma model to API response
export function transformCropToApiResponse(crop: CropModel): Crop {
  return {
    ...crop,
    nitrogenSupply: crop.nitrogenSupply.toNumber(),
    nitrogenDemand: crop.nitrogenDemand.toNumber(),
    soilResidualNitrogen: crop.soilResidualNitrogen?.toNumber() ?? null,
    details: crop.details.map(detail => ({
      ...detail,
      detailType: isValidDetailType(detail.detailType) ? detail.detailType : 'FERTILIZER' // fallback to FERTILIZER if invalid
    }))
  };
}
