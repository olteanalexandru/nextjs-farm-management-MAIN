
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
  
  export type WikiQueryParams = {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    cropType?: string;
    soilType?: string;
  };