import { Decimal } from '@prisma/client/runtime/library';

export type DetailType = 'FERTILIZER' | 'PEST' | 'DISEASE';

export interface Post {
  imageUrl: any;
  author: any;
  id: number;
  userId: string;
  title: string;
  brief: string | null;
  description: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
    email: string;
  };
  tags?: string;
  readingTime?: number;
  likes?: number;
  shares?: number;
  featured?: boolean;
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

export interface CropDetail {
  id: number;
  cropId: number;
  detailType: DetailType | string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CropModel {
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
  nitrogenSupply: number | Decimal | null;
  nitrogenDemand: number | Decimal | null;
  soilResidualNitrogen: number | Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  deleted: Date | null;
  details: CropDetail[];
  user?: {
    name: string;
    email: string;
  };
}

export interface Crop {

  _id: string | number;

  cropName: string;

  cropType: string;

  cropVariety?: string;

  plantingDate?: string;

  harvestingDate?: string;

  description?: string;

  imageUrl?: string;

  soilType?: string;

  climate?: string;

  ItShouldNotBeRepeatedForXYears: number;

  nitrogenSupply: number;

  nitrogenDemand: number;

  soilResidualNitrogen: number;

  fertilizers: string[];

  pests: string[];

  diseases: string[];

  user?: {

    id: string;

    auth0Id: string;

    roleType: string;

  };

}

export interface CropType {
  id: string | number;
  _id?: string;
  cropName: string;
  cropType: string;
  cropVariety?: string;
  soilType?: string;
  nitrogenSupply?: number;
  nitrogenDemand?: number;
  fertilizers?: string[];
  pests?: string[];
  diseases?: string[];
  ItShouldNotBeRepeatedForXYears?: number;
  plantingDate?: string;
  harvestingDate?: string;
  description?: string;
  imageUrl?: string;
  climate?: string;
  userId?: string;
  auth0Id?: string;
  isSelected?: boolean;
}

export interface CropCreate {
  cropName: string;
  cropType: string;
  cropVariety: string;
  soilType: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilResidualNitrogen: number;
  ItShouldNotBeRepeatedForXYears: number;
  fertilizers: string[];
  pests: string[];
  diseases: string[];
  climate: string;
  description: string;
  imageUrl?: string;
  plantingDate?: string;
  harvestingDate?: string;
}

export interface RecommendationResponse {
  id: number;
  _id: string;
  userId?: string;  // Add userId
  auth0Id?: string; // Add auth0Id
  cropName: string;
  cropType: string;
  cropVariety?: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
  isSelected?: boolean;
  isOwnCrop?: boolean;  // Add this field
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

export interface ApiResponse<T = any> {
  data?: T;
  crops?: T[];
  posts?: T[];  // Change this line to expect an array of T[]
  selections?: any[];
  error?: string;
  status?: number;
  message?: string;
}

export function isValidDetailType(type: string): type is DetailType {
  return ['FERTILIZER', 'PEST', 'DISEASE'].includes(type as DetailType);
}

export function transformCropToApiResponse(crop: CropModel): Crop {
  return {
    _id: crop.id,
    cropName: crop.cropName,
    cropType: crop.cropType || '',
    cropVariety: crop.cropVariety || '',
    plantingDate: crop.plantingDate?.toISOString(),
    harvestingDate: crop.harvestingDate?.toISOString(),
    description: crop.description || undefined,
    imageUrl: crop.imageUrl || undefined,
    soilType: crop.soilType || '',
    climate: crop.climate || '',
    ItShouldNotBeRepeatedForXYears: crop.ItShouldNotBeRepeatedForXYears || 0,
    nitrogenSupply: crop.nitrogenSupply ? Number(crop.nitrogenSupply) : 0,
    nitrogenDemand: crop.nitrogenDemand ? Number(crop.nitrogenDemand) : 0,
    soilResidualNitrogen: crop.soilResidualNitrogen ? Number(crop.soilResidualNitrogen) : 0,
    fertilizers: crop.details
      ?.filter(d => d.detailType === 'FERTILIZER')
      .map(d => d.value) || [],
    pests: crop.details
      ?.filter(d => d.detailType === 'PEST')
      .map(d => d.value) || [],
    diseases: crop.details
      ?.filter(d => d.detailType === 'DISEASE')
      .map(d => d.value) || []
  };
}

export function transformPrismaPost(prismaPost: any): Post {
  return {
    id: prismaPost.id,
    userId: prismaPost.userId,
    title: prismaPost.title,
    brief: prismaPost.brief,
    description: prismaPost.description,
    imageUrl: prismaPost.image,  // map image to imageUrl
    image: prismaPost.image,  // add image property
    author: prismaPost.user?.name || null,  // map user.name to author
    createdAt: prismaPost.createdAt,
    updatedAt: prismaPost.updatedAt,
    user: prismaPost.user
  };
}


