interface SoilTest {
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  texture: string;
}

interface Crop {
  id: number;
  cropName: string;
  nitrogenDemand: number;
  nitrogenSupply: number;
  soilResidualNitrogen?: number;
}

interface FertilizerRecommendation {
  applicationRate: number;
  fertilizer: string;
  applicationMethod: string;
  timing: string;
  notes: string;
}

export class FertilizationService {
  private static readonly pH_RANGES = {
    min: 5.5,
    max: 7.5,
    optimal: 6.5
  };

  private static readonly TEXTURE_FACTORS = {
    'Sandy': 1.2,    // Requires more frequent applications
    'Loamy': 1.0,    // Base reference
    'Clay': 0.8,     // Retains nutrients better
    'Silt': 0.9,
    'Sandy Loam': 1.1,
    'Clay Loam': 0.85,
    'Silt Loam': 0.95
  };

  private static readonly SEASONAL_FACTORS = {
    spring: 1.2,     // Higher demand during main growth
    summer: 1.0,
    fall: 0.8,
    winter: 0.6
  };

  static calculateNitrogenRequirement(
    crop: Crop,
    soilTest: SoilTest,
    season: 'spring' | 'summer' | 'fall' | 'winter'
  ): number {
    // Base nitrogen requirement
    let requirement = crop.nitrogenDemand - crop.nitrogenSupply;

    // Adjust for soil nitrogen
    requirement -= soilTest.nitrogen;

    // Adjust for residual nitrogen if available
    if (crop.soilResidualNitrogen) {
      requirement -= crop.soilResidualNitrogen;
    }

    // Adjust for soil organic matter (each 1% can provide about 20 kg N/ha/year)
    const organicNitrogen = soilTest.organicMatter * 20;
    requirement -= (organicNitrogen / 4); // Divide by 4 for seasonal availability

    // Apply texture factor
    const textureFactor = this.TEXTURE_FACTORS[soilTest.texture as keyof typeof this.TEXTURE_FACTORS] || 1.0;
    requirement *= textureFactor;

    // Apply seasonal factor
    requirement *= this.SEASONAL_FACTORS[season];

    // Ensure we don't recommend negative values
    return Math.max(0, requirement);
  }

  static getFertilizerRecommendation(
    crop: Crop,
    soilTest: SoilTest,
    season: 'spring' | 'summer' | 'fall' | 'winter'
  ): FertilizerRecommendation {
    const nitrogenReq = this.calculateNitrogenRequirement(crop, soilTest, season);
    
    // Base recommendation
    const recommendation: FertilizerRecommendation = {
      applicationRate: 0,
      fertilizer: '',
      applicationMethod: '',
      timing: '',
      notes: ''
    };

    // Select fertilizer type based on soil pH and crop needs
    if (soilTest.pH < this.pH_RANGES.min) {
      recommendation.fertilizer = 'Calcium Ammonium Nitrate';
      recommendation.notes = 'Consider lime application to raise soil pH. ';
    } else if (soilTest.pH > this.pH_RANGES.max) {
      recommendation.fertilizer = 'Ammonium Sulfate';
      recommendation.notes = 'Consider sulfur application to lower soil pH. ';
    } else {
      recommendation.fertilizer = 'Urea';
    }

    // Calculate application rate based on fertilizer nitrogen content
    const fertilizerNContent = {
      'Calcium Ammonium Nitrate': 0.27,
      'Ammonium Sulfate': 0.21,
      'Urea': 0.46
    };
    const selectedFertilizerN = fertilizerNContent[recommendation.fertilizer as keyof typeof fertilizerNContent];
    recommendation.applicationRate = (nitrogenReq / selectedFertilizerN);

    // Determine application method based on soil texture
    if (soilTest.texture === 'Sandy' || soilTest.texture === 'Sandy Loam') {
      recommendation.applicationMethod = 'Split Application';
      recommendation.notes += 'Multiple smaller applications recommended for sandy soil. ';
    } else if (soilTest.texture === 'Clay' || soilTest.texture === 'Clay Loam') {
      recommendation.applicationMethod = 'Band Application';
      recommendation.notes += 'Band application recommended for clay soil. ';
    } else {
      recommendation.applicationMethod = 'Broadcast';
    }

    // Set timing based on season
    switch (season) {
      case 'spring':
        recommendation.timing = 'Early spring before planting';
        break;
      case 'summer':
        recommendation.timing = 'Split between growth stages';
        break;
      case 'fall':
        recommendation.timing = 'Post-harvest application';
        break;
      case 'winter':
        recommendation.timing = 'Late winter before spring growth';
        break;
    }

    // Add additional notes based on soil conditions
    if (soilTest.organicMatter > 4) {
      recommendation.notes += 'High organic matter content may reduce fertilizer needs. ';
    }
    if (soilTest.nitrogen > crop.nitrogenDemand * 0.5) {
      recommendation.notes += 'Consider reducing nitrogen application rate. ';
    }

    return recommendation;
  }

  static getSeason(date: Date): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}
