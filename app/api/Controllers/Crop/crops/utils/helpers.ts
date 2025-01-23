import { RecommendationResponse } from "app/types/api";
import { Decimal } from "@prisma/client/runtime/library";

export function toDecimal(value: number | null | undefined): Decimal {
    if (value === null || value === undefined || isNaN(value)) {
    return new Decimal(0);
    }
    return new Decimal(value);
  }
  
  export function transformCropWithDetails(crop: any): RecommendationResponse {
    return {
      id: crop.id,
      _id: crop.id.toString(),
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
      nitrogenSupply: Number(crop.nitrogenSupply) || 0,
      nitrogenDemand: Number(crop.nitrogenDemand) || 0,
      soilResidualNitrogen: crop.soilResidualNitrogen ? Number(crop.soilResidualNitrogen) : undefined,
      fertilizers: crop.details
        ?.filter((d: any) => d.detailType === 'FERTILIZER')
        .map((d: any) => d.value) || [],
      pests: crop.details
        ?.filter((d: any) => d.detailType === 'PEST')
        .map((d: any) => d.value) || [],
      diseases: crop.details
        ?.filter((d: any) => d.detailType === 'DISEASE')
        .map((d: any) => d.value) || []
    };
  }
