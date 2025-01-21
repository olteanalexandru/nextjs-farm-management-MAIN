import { Decimal } from '@prisma/client/runtime/library';

export type DetailType = 'FERTILIZER' | 'PEST' | 'DISEASE';

export interface Post {
  id: number;
  userId: string;
  title: string;
  brief: string | null;
  description: string | null;
  imageUrl: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: string; // Add author property
  tags?: string; // Add tags property
  user?: {
    name: string;
    email: string;
  };
}

export interface PostCreate {
  title: string;
  brief?: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  content?: string;
}

export interface PostUpdate {
  title?: string;
  brief?: string;
  description?: string;
  imageUrl?: string;
  published?: boolean;
}

export interface CropDetail {
  id: number;
  cropId: number;
  detailType: DetailType | string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Crop {
  id: number;
  userId: string;
  cropName: string;
  cropType: string | null;
  cropVariety: string | null;
  plantingDate: Date | null;
  harvestingDate: Date | null;
  description: string | null;
  imageUrl: string | null;
  soilType: string | null;
  climate: string | null;
  ItShouldNotBeRepeatedForXYears: number | null;
  nitrogenSupply: Decimal;
  nitrogenDemand: Decimal;
  soilResidualNitrogen: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  deleted: Date | null;
  details?: CropDetail[];
  user?: {
    name: string;
    email: string;
  };
}

export interface CropCreate {
  cropName: string;
  cropType?: string;
  cropVariety?: string;
  plantingDate?: Date | string;
  harvestingDate?: Date | string;
  description?: string;
  imageUrl?: string;
  soilType?: string;
  climate?: string;
  ItShouldNotBeRepeatedForXYears?: number;
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilResidualNitrogen?: number;
  details?: {
    detailType: DetailType;
    value: string;
  }[];
  diseases?: string[];
  pests?: string[];
  fertilizers?: string[];
}

export interface RecommendationResponse {
  id: number;
  _id?: string;
  userId?: string;
  auth0Id?: string;
  cropName: string;
  cropType: string;
  cropVariety?: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests?: string[];
  diseases?: string[];
  isSelected?: boolean;
  isOwnCrop?: boolean;
  soilType?: string;
  fertilizers?: string[];
  plantingDate?: string;
  harvestingDate?: string;
  description?: string;
  imageUrl?: string;
  climate?: string;
  ItShouldNotBeRepeatedForXYears?: number;
  soilResidualNitrogen?: number;
}

export interface CropUpdate {
  cropName?: string;
  cropType?: string;
  cropVariety?: string;
  plantingDate?: Date;
  harvestingDate?: Date;
  description?: string;
  imageUrl?: string;
  soilType?: string;
  climate?: string;
  ItShouldNotBeRepeatedForXYears?: number;
  nitrogenSupply?: number;
  nitrogenDemand?: number;
  soilResidualNitrogen?: number;
  details?: {
    detailType: DetailType;
    value: string;
  }[];
}

export interface ApiResponse<T = any> {
  data?: T;
  posts?: T extends Post[] ? T : never;
  crops?: T extends (Crop[] | RecommendationResponse[]) ? T : never;
  error?: string;
  status?: number;
  message?: string;
}

export function isValidDetailType(type: string): type is DetailType {
  return ['FERTILIZER', 'PEST', 'DISEASE'].includes(type as DetailType);
}

export function transformPrismaPost(prismaPost: any): Post {
  return {
    id: prismaPost.id,
    userId: prismaPost.userId,
    title: prismaPost.title,
    brief: prismaPost.brief,
    description: prismaPost.description,
    imageUrl: prismaPost.imageUrl,
    published: prismaPost.published,
    createdAt: prismaPost.createdAt,
    updatedAt: prismaPost.updatedAt,
    user: prismaPost.user ? {
      name: prismaPost.user.name,
      email: prismaPost.user.email
    } : undefined
  };
}

export interface Rotation {
  id: number;
  userId: string;
  rotationName: string;
  fieldSize: Decimal;
  numberOfDivisions: number;
  createdAt: Date;
  updatedAt: Date;
  rotationPlans?: RotationPlan[];
  user?: {
    name: string;
    email: string;
  };
}

export interface RotationPlan {
  id: number;
  rotationId: number;
  year: number;
  division: number;
  cropId: number;
  plantingDate: Date | null;
  harvestingDate: Date | null;
  divisionSize: Decimal | null;
  nitrogenBalance: Decimal | null;
  directlyUpdated: boolean;
  createdAt: Date;
  updatedAt: Date;
  crop?: Crop;
}

export interface UserCropSelection {
  id: number;
  userId: string;
  cropId: number;
  selectionCount: number;
  createdAt: Date;
  updatedAt: Date;
  crop?: Crop;
  user?: {
    name: string;
    email: string;
  };
}

export interface SoilTest {
  id: number;
  userId: string;
  testDate: Date;
  fieldLocation: string;
  pH: Decimal;
  organicMatter: Decimal;
  nitrogen: Decimal;
  phosphorus: Decimal;
  potassium: Decimal;
  texture: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
    email: string;
  };
}

export interface RotationCreate {
  rotationName: string;
  fieldSize: number;
  numberOfDivisions: number;
}

export interface RotationUpdate {
  rotationName?: string;
  fieldSize?: number;
  numberOfDivisions?: number;
}

export interface RotationPlanCreate {
  rotationId: number;
  year: number;
  division: number;
  cropId: number;
  plantingDate?: Date | string;
  harvestingDate?: Date | string;
  divisionSize?: number;
  nitrogenBalance?: number;
}

export interface RotationPlanUpdate {
  year?: number;
  division?: number;
  cropId?: number;
  plantingDate?: Date | string;
  harvestingDate?: Date | string;
  divisionSize?: number;
  nitrogenBalance?: number;
  directlyUpdated?: boolean;
}

export interface SoilTestCreate {
  testDate: Date | string;
  fieldLocation: string;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  texture: string;
  notes?: string;
}

export interface SoilTestUpdate {
  testDate?: Date | string;
  fieldLocation?: string;
  pH?: number;
  organicMatter?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  texture?: string;
  notes?: string;
}

export interface FertilizationPlanCreate {
  cropId: number;
  plannedDate: Date | string;
  fertilizer: string;
  applicationRate: number;
  nitrogenContent: number;
  applicationMethod: string;
  notes?: string;
}

export interface FertilizationPlanUpdate {
  cropId?: number;
  plannedDate?: Date | string;
  fertilizer?: string;
  applicationRate?: number;
  nitrogenContent?: number;
  applicationMethod?: string;
  notes?: string;
  completed?: boolean;
  completedDate?: Date | string;
}

export interface FertilizationPlan {
  id: number;
  userId: string;
  cropId: number;
  plannedDate: Date;
  fertilizer: string;
  applicationRate: Decimal;
  nitrogenContent: Decimal;
  applicationMethod: string;
  notes: string | null;
  completed: boolean;
  completedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  crop?: Crop;
  user?: {
    name: string;
    email: string;
  };
}

export function transformPrismaCrop(prismaCrop: any): Crop {
  return {
    id: prismaCrop.id,
    userId: prismaCrop.userId,
    cropName: prismaCrop.cropName,
    cropType: prismaCrop.cropType,
    cropVariety: prismaCrop.cropVariety,
    plantingDate: prismaCrop.plantingDate,
    harvestingDate: prismaCrop.harvestingDate,
    description: prismaCrop.description,
    imageUrl: prismaCrop.imageUrl,
    soilType: prismaCrop.soilType,
    climate: prismaCrop.climate,
    ItShouldNotBeRepeatedForXYears: prismaCrop.ItShouldNotBeRepeatedForXYears,
    nitrogenSupply: prismaCrop.nitrogenSupply,
    nitrogenDemand: prismaCrop.nitrogenDemand,
    soilResidualNitrogen: prismaCrop.soilResidualNitrogen,
    createdAt: prismaCrop.createdAt,
    updatedAt: prismaCrop.updatedAt,
    deleted: prismaCrop.deleted,
    details: prismaCrop.details,
    user: prismaCrop.user ? {
      name: prismaCrop.user.name,
      email: prismaCrop.user.email
    } : undefined
  };
}

