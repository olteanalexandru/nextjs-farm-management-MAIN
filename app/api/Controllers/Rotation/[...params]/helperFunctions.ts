import { CropInput } from '../interfaces';
import { prisma } from 'app/lib/prisma';

export function hasSharedPests(crop1: CropInput, crop2: CropInput): boolean {
    return crop1.pests.some(pest => crop2.pests.includes(pest));
  }
  
  export function hasSharedDiseases(crop1: CropInput, crop2: CropInput): boolean {
    return crop1.diseases.some(disease => crop2.diseases.includes(disease));
  }
  
 export function calculateNitrogenBalance(
    crop: CropInput,
    nitrogenPerDivision: number,
    soilResidualNitrogen: number
  ): number {
    const nitrogenBalance = nitrogenPerDivision - crop.nitrogenDemand + soilResidualNitrogen;
    return parseFloat(Math.max(0, nitrogenBalance).toFixed(2));
  }
  
 export  function sortCropsByNitrogenBalance(
    crops: CropInput[],
    nitrogenPerDivision: number,
    soilResidualNitrogen: number
  ): CropInput[] {
    return [...crops].sort((a, b) => {
      const balanceA = calculateNitrogenBalance(a, nitrogenPerDivision, soilResidualNitrogen);
      const balanceB = calculateNitrogenBalance(b, nitrogenPerDivision, soilResidualNitrogen);
      return balanceA - balanceB;
    });
  }
  
  export async function cropIsAvailable(
    crop: CropInput,
    year: number,
    lastUsedYear: Map<number, Map<string, number>>,
    division: number,
    userId: string
  ): Promise<boolean> {
    const divisionLastUsedYear = lastUsedYear.get(division) || new Map<string, number>();
    const lastUsed = divisionLastUsedYear.get(crop.cropName) || 0;
  
    if (year - lastUsed <= crop.ItShouldNotBeRepeatedForXYears) {
      return false;
    }
  
    const selection = await prisma.userCropSelection.findUnique({
      where: {
        userId_cropId: {
          userId: userId,
          cropId: crop.id
        }
      }
    });
  
    return selection ? selection.selectionCount > 0 : false;
  }