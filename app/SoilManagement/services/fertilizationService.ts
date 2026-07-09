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

export interface NutrientRecommendation {
  nutrient: 'N' | 'P' | 'K';
  fertilizer: string;
  applicationRate: number;
  applicationMethod: string;
  timing: string;
  notes: string;
}

export interface FertilizerRecommendation {
  // Primary nitrogen recommendation (kept for backward compat)
  fertilizer: string;
  applicationRate: number;
  applicationMethod: string;
  timing: string;
  notes: string;
  // Additional nutrient recommendations
  phosphorusRecommendation: NutrientRecommendation | null;
  potassiumRecommendation: NutrientRecommendation | null;
}

const PHOSPHORUS_LOW_THRESHOLD = 20;   // mg/kg
const POTASSIUM_LOW_THRESHOLD = 100;   // mg/kg
const PHOSPHORUS_VERY_LOW_THRESHOLD = 10;
const POTASSIUM_VERY_LOW_THRESHOLD = 50;

export class FertilizationService {
  private static readonly pH_RANGES = {
    min: 5.5,
    max: 7.5,
    optimal: 6.5
  };

  private static readonly TEXTURE_FACTORS: Record<string, number> = {
    'Sandy': 1.2,
    'Loamy': 1.0,
    'Clay': 0.8,
    'Silt': 0.9,
    'Sandy Loam': 1.1,
    'Clay Loam': 0.85,
    'Silt Loam': 0.95
  };

  private static readonly SEASONAL_FACTORS = {
    spring: 1.2,
    summer: 1.0,
    fall: 0.8,
    winter: 0.6
  };

  static calculateNitrogenRequirement(
    crop: Crop,
    soilTest: SoilTest,
    season: 'spring' | 'summer' | 'fall' | 'winter'
  ): number {
    let requirement = crop.nitrogenDemand - crop.nitrogenSupply;
    requirement -= soilTest.nitrogen;
    if (crop.soilResidualNitrogen) {
      requirement -= crop.soilResidualNitrogen;
    }
    const organicNitrogen = soilTest.organicMatter * 20;
    requirement -= organicNitrogen / 4;
    const textureFactor = this.TEXTURE_FACTORS[soilTest.texture] ?? 1.0;
    requirement *= textureFactor;
    requirement *= this.SEASONAL_FACTORS[season];
    return Math.max(0, requirement);
  }

  private static nitrogenFertilizer(soilTest: SoilTest, nitrogenReq: number, season: string): NutrientRecommendation {
    let fertilizer: string;
    let notes = '';

    if (soilTest.pH < this.pH_RANGES.min) {
      fertilizer = 'Calcium Ammonium Nitrate';
      notes = 'Consider lime application to raise soil pH. ';
    } else if (soilTest.pH > this.pH_RANGES.max) {
      fertilizer = 'Ammonium Sulfate';
      notes = 'Consider sulfur application to lower soil pH. ';
    } else {
      fertilizer = 'Urea';
    }

    const nContent: Record<string, number> = {
      'Calcium Ammonium Nitrate': 0.27,
      'Ammonium Sulfate': 0.21,
      'Urea': 0.46
    };
    const applicationRate = nitrogenReq / (nContent[fertilizer] ?? 0.46);

    let applicationMethod: string;
    if (soilTest.texture === 'Sandy' || soilTest.texture === 'Sandy Loam') {
      applicationMethod = 'Split Application';
      notes += 'Multiple smaller applications recommended for sandy soil. ';
    } else if (soilTest.texture === 'Clay' || soilTest.texture === 'Clay Loam') {
      applicationMethod = 'Band Application';
      notes += 'Band application recommended for clay soil. ';
    } else {
      applicationMethod = 'Broadcast';
    }

    if (soilTest.organicMatter > 4) {
      notes += 'High organic matter may reduce nitrogen needs. ';
    }

    const timingMap: Record<string, string> = {
      spring: 'Early spring before planting',
      summer: 'Split between growth stages',
      fall: 'Post-harvest application',
      winter: 'Late winter before spring growth'
    };

    return {
      nutrient: 'N',
      fertilizer,
      applicationRate: Math.round(applicationRate * 100) / 100,
      applicationMethod,
      timing: timingMap[season] ?? 'As needed',
      notes: notes.trim()
    };
  }

  private static phosphorusFertilizer(soilTest: SoilTest, season: string): NutrientRecommendation | null {
    if (soilTest.phosphorus >= PHOSPHORUS_LOW_THRESHOLD) return null;

    const deficit = PHOSPHORUS_LOW_THRESHOLD - soilTest.phosphorus;
    const veryLow = soilTest.phosphorus < PHOSPHORUS_VERY_LOW_THRESHOLD;
    const fertilizer = soilTest.pH > 7.0 ? 'Triple Superphosphate' : 'Single Superphosphate';
    const pContent = fertilizer === 'Triple Superphosphate' ? 0.46 : 0.18;
    // Approximate: each 1 mg/kg soil P deficit needs ~3.5 kg/ha of P2O5
    const p2o5Needed = deficit * 3.5;
    const applicationRate = Math.round((p2o5Needed / pContent) * 100) / 100;

    const timingMap: Record<string, string> = {
      spring: 'Before planting or at planting',
      summer: 'Early summer side-dress',
      fall: 'Fall incorporation before tillage',
      winter: 'Late winter before spring'
    };

    return {
      nutrient: 'P',
      fertilizer,
      applicationRate,
      applicationMethod: 'Band Application (near root zone)',
      timing: timingMap[season] ?? 'As needed',
      notes: veryLow
        ? 'Phosphorus is critically low — prioritise P application this season.'
        : 'Phosphorus is below optimal; application will improve root development and yield.'
    };
  }

  private static potassiumFertilizer(soilTest: SoilTest, season: string): NutrientRecommendation | null {
    if (soilTest.potassium >= POTASSIUM_LOW_THRESHOLD) return null;

    const deficit = POTASSIUM_LOW_THRESHOLD - soilTest.potassium;
    const veryLow = soilTest.potassium < POTASSIUM_VERY_LOW_THRESHOLD;
    // Use potassium sulfate for crops sensitive to chloride (e.g., fruits), MOP otherwise
    const fertilizer = 'Muriate of Potash (MOP)';
    const kContent = 0.60; // 60% K2O
    const k2oNeeded = deficit * 2.0;
    const applicationRate = Math.round((k2oNeeded / kContent) * 100) / 100;

    const timingMap: Record<string, string> = {
      spring: 'Pre-planting broadcast',
      summer: 'Split application in summer',
      fall: 'Fall application before tillage',
      winter: 'Late winter pre-spring application'
    };

    return {
      nutrient: 'K',
      fertilizer,
      applicationRate,
      applicationMethod: soilTest.texture === 'Sandy' || soilTest.texture === 'Sandy Loam'
        ? 'Split Application'
        : 'Broadcast and Incorporate',
      timing: timingMap[season] ?? 'As needed',
      notes: veryLow
        ? 'Potassium is critically low — apply before this season starts.'
        : 'Potassium is below optimal; application will improve stress tolerance and quality.'
    };
  }

  static getFertilizerRecommendation(
    crop: Crop,
    soilTest: SoilTest,
    season: 'spring' | 'summer' | 'fall' | 'winter'
  ): FertilizerRecommendation {
    const nitrogenReq = this.calculateNitrogenRequirement(crop, soilTest, season);
    const nRec = this.nitrogenFertilizer(soilTest, nitrogenReq, season);
    const pRec = this.phosphorusFertilizer(soilTest, season);
    const kRec = this.potassiumFertilizer(soilTest, season);

    return {
      fertilizer: nRec.fertilizer,
      applicationRate: nRec.applicationRate,
      applicationMethod: nRec.applicationMethod,
      timing: nRec.timing,
      notes: nRec.notes,
      phosphorusRecommendation: pRec,
      potassiumRecommendation: kRec
    };
  }

  static getSeason(date: Date): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}
