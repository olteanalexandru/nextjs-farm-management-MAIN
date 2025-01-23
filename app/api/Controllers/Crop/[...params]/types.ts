
export type CropCreate = {
    cropName: string;
    cropType: string;
    cropVariety: string;
    soilType: string;
    nitrogenSupply: number;
    nitrogenDemand: number;
    soilResidualNitrogen: number;
    ItShouldNotBeRepeatedForXYears: number;
    plantingDate: string;
    harvestingDate: string;
    
    fertilizers: string[];
    pests: string[];
    diseases: string[];
    climate: string;
    description: string;
    imageUrl: string;
    
  };
  