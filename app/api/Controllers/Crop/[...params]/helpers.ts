import { Crop } from "app/types/api";

export function toDecimal(value: number | null | undefined): number {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    return Number(value);
  }
  
  export function transformCropWithDetails(crop: any): Crop {
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
      nitrogenSupply: toDecimal(crop.nitrogenSupply),
      nitrogenDemand: toDecimal(crop.nitrogenDemand),
      soilResidualNitrogen: toDecimal(crop.soilResidualNitrogen),
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