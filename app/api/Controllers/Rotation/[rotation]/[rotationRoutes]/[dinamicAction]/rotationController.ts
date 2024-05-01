
const asyncHandler = require('express-async-handler')

const Crop = require('../Models/cropModel')
import Rotation from '../../Models/rotationModel';
import User from '../../Models/userModel';

import { CustomRequest, Crop, Response, CropRotationInput , CropRotationItem } from '../interfaces/CropInterfaces';

  class RotationController {
    usedCropsInYear: Map<number, string[]>;

    constructor() {
      this.usedCropsInYear = new Map();
      this.generateCropRotation = this.generateCropRotation.bind(this);
      this.sortCropsByNitrogenBalance = this.sortCropsByNitrogenBalance.bind(this);
      this.calculateNitrogenBalance = this.calculateNitrogenBalance.bind(this);
      this.updateNitrogenBalanceAndRegenerateRotation = this.updateNitrogenBalanceAndRegenerateRotation.bind(this);
      this.updateDivisionSizeAndRedistribute = this.updateDivisionSizeAndRedistribute.bind(this);
      this.getCropRotation = this.getCropRotation.bind(this);
      this.deleteCropRotation = this.deleteCropRotation.bind(this);
      
    }

    router = require('express').Router();

    public cropIsAvailable = async (crop: Crop, year: number, lastUsedYear: Map<number, Map<Crop, number>>, division: number, userId: string, maxRepetitions: number): Promise<boolean> => {
      const divisionLastUsedYear = lastUsedYear.get(division) || new Map<Crop, number>();
      
      const lastUsed = divisionLastUsedYear.get(crop) || 0;
    
      // Fetch user
      const user = await User.findById(userId);
    
      // Check selectareCounts for crop selection count
      if (year - lastUsed <= crop.ItShouldNotBeRepeatedForXYears && ((user.selectareCounts[crop._id] || 0) <= maxRepetitions || maxRepetitions < 1)) {
        return false;
      }
    
      // Check if crop was used in the same year
      if (this.usedCropsInYear.get(year)?.includes(crop._id) ) {
        return false;
      }
    
      return true;
    }
      


    public generateCropRotation = asyncHandler(async (req: CustomRequest, res: Response) => {
      const input: CropRotationInput = req.body;  
      
      const {
        rotationName,
        crops,
        fieldSize,
        numberOfDivisions,
        maxYears ,
        ResidualNitrogenSupply ,
    
      } = input;
      const TheResidualNitrogenSupply = ResidualNitrogenSupply ?? 500;
    
      if (!crops || crops.length === 0) {
        res.status(400);
        throw new Error('No crops provided');
      }
    
      const rotationPlan: Map<number, CropRotationItem[]> = new Map();
      const lastUsedYear: Map<number, Map<Crop, number>> = new Map();
      const usedCropsInYear: Map<number, Set<string>> = new Map();
      
    
      for (let division = 1; division <= numberOfDivisions; division++) {
        
        const divisionLastUsedYear: Map<Crop, number> = new Map();
        crops.forEach(crop => {
          divisionLastUsedYear.set(crop, 0 - crop.ItShouldNotBeRepeatedForXYears);
        });
        lastUsedYear.set(division, divisionLastUsedYear);
      }
    
      function hasSharedPests(crop1: Crop, crop2: Crop): boolean {
        return crop1.pests.some((pest) => crop2.pests.includes(pest));
      }
    
      function hasSharedDiseases(crop1: Crop, crop2: Crop): boolean {
        return crop1.diseases.some((disease) => crop2.diseases.includes(disease));
      }
    
    
    
      for (let year = 1; year <= maxYears; year++) {
        usedCropsInYear.set(year, new Set<string>());
        let yearlyPlan = [];
        rotationPlan.set(year, yearlyPlan);
    
        for (let division = 1; division <= numberOfDivisions; division++) {
          const prevCrop = rotationPlan.get(year - 1)?.find((item) => item.division === division)?.crop;
          const prevYear = rotationPlan.get(year - 1)?.find((item) => item.division === division);
    // If there is a previous crop
          if (prevCrop) {
            const nitrogenPerDivision = prevCrop.nitrogenSupply + prevYear.nitrogenBalance ;
            const divisionSize = parseFloat((fieldSize / numberOfDivisions).toFixed(2));
            const sortedCrops = this.sortCropsByNitrogenBalance(crops, nitrogenPerDivision, 0);
            let crop;
            // Find a crop that is available and has no shared pests or diseases with the previous crop
            for (const c of sortedCrops) {
              const isAvailable = await this.cropIsAvailable(c, year, lastUsedYear, division, req.user.id, req.user.numSelections);
              if (!hasSharedPests(c, prevCrop) && !hasSharedDiseases(c, prevCrop) && isAvailable) {
                crop = c;
                lastUsedYear.get(division)?.set(crop, year); // Update the last used year for the division
                break;
              }
            }
      
            if (!crop) {
              continue; // Skip to next division if no crop is available
            }
    // If a crop is found, add it to the rotation plan
            if (crop) {
              if (!usedCropsInYear.has(year)) {
                usedCropsInYear.set(year, new Set<string>());
              }
              lastUsedYear.get(division)?.set(crop, year);
              // Add crop to used crops in year
    usedCropsInYear.get(year)?.add(crop._id) || usedCropsInYear.set(year, new Set([crop._id]));
               // Calculate planting and harvesting dates
              const plantingDate = new Date(crop.plantingDate);
              plantingDate.setFullYear(plantingDate.getFullYear() + year - 1);
    
              const harvestingDate = new Date(crop.harvestingDate);
              harvestingDate.setFullYear(harvestingDate.getFullYear() + year - 1);
    
              const nitrogenBalance = this.calculateNitrogenBalance(crop, nitrogenPerDivision, 0);
    
              rotationPlan.set(year, [...(rotationPlan.get(year) || []), {
                division,
                crop,
                plantingDate: plantingDate.toISOString().substring(0, 10),
                harvestingDate: harvestingDate.toISOString().substring(0, 10),
                divisionSize,
                nitrogenBalance,
              }]);
            }
            // If there is no previous crop
          } else {
            const cropIndex = (division + year - 2) % crops.length;
            const crop = crops[cropIndex];
            const divisionSize = parseFloat((fieldSize / numberOfDivisions).toFixed(2));
    
  
            if (this.cropIsAvailable(crop, year, lastUsedYear, division, req.user.id, req.user.numSelections)) {
              lastUsedYear.get(division)?.set(crop, year);
              const plantingDate = new Date(crop.plantingDate);
              plantingDate.setFullYear(plantingDate.getFullYear() + year - 1);
              const harvestingDate = new Date(crop.harvestingDate);
              harvestingDate.setFullYear(harvestingDate.getFullYear() + year - 1);
              const soilResidualNitrogen: number = crop.soilResidualNitrogen ?? TheResidualNitrogenSupply;
  
              const nitrogenBalance = this.calculateNitrogenBalance(crop, crop.nitrogenSupply, soilResidualNitrogen);
    
              rotationPlan.set(year, [...(rotationPlan.get(year) || []), {
                division,
                crop,
                plantingDate: plantingDate.toISOString().substring(0, 10),
                harvestingDate: harvestingDate.toISOString().substring(0, 10),
                divisionSize,
                nitrogenBalance,
              }]);
            }
          }
        }
      }
    
      const rotation = new Rotation({
        user: req.user.id,
        fieldSize,
        numberOfDivisions,
        rotationName : input.rotationName,
        crops: input.crops,
        rotationPlan: Array.from(rotationPlan.entries()).map(([year, rotationItems]) => ({ year, rotationItems })),
      });
      
      const createdRotation = await rotation.save();
      
      const cropsToUpdate = await Crop.find({ _id: { $in: input.crops } });
      
      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }
      
      // Increment the count of each crop in the user's selectareCounts
      input.crops.forEach(crop => {
        user.selectareCounts[crop._id] = (user.selectareCounts[crop._id] || 0) + 1;
      });
      await user.save();
    
      const updatePromises = cropsToUpdate.map((crop) => {
        // Update the crop's soilResidualNitrogen with the one in the last year of the rotation
        crop.soilResidualNitrogen =  rotationPlan.get(maxYears)?.find((item) => item.crop._id === crop._id)?.nitrogenBalance;
        return crop.save();
      });
      await Promise.all(updatePromises);
    
      if (createdRotation) {
        res.status(201).json(createdRotation);
      } else {
        res.status(500);
        throw new Error('Failed to generate crop rotation');
      }
    });

    public sortCropsByNitrogenBalance = (crops: Crop[], nitrogenPerDivision: number, soilResidualNitrogen: number) => {
      return crops.sort((a, b) => {
        const balanceA = this.calculateNitrogenBalance(a, nitrogenPerDivision,  soilResidualNitrogen );
        const balanceB = this.calculateNitrogenBalance(b, nitrogenPerDivision,  soilResidualNitrogen );
        return balanceA - balanceB;
      });
    }

    public calculateNitrogenBalance = (crop: Crop, nitrogenPerDivision: number, soilResidualNitrogen: number) => {
      const nitrogenBalance = nitrogenPerDivision - crop.nitrogenDemand + soilResidualNitrogen;
      // No negative nitrogen balance
      const balance = nitrogenBalance < 0 ? 0 : nitrogenBalance;
      // Set nitrogen balance to 2 decimal places
      return parseFloat(balance.toFixed(2));
    }
    public updateNitrogenBalanceAndRegenerateRotation = asyncHandler(async (req: CustomRequest, res: Response) => {
      const { year, rotationName, division, nitrogenBalance } = req.body;
    
      // Find the rotation for the given id
      const rotation = await Rotation.findOne({ rotationName }).populate('crops');
    
      if (!rotation) {
        res.status(404);
        throw new Error('Rotation not found');
      }
    
      // Get the rotation plans for the specific year and the following years
      const relevantYearPlans = rotation.rotationPlan.filter(item => item.year >= year);
    
      if (!relevantYearPlans.length) {
        res.status(404);
        throw new Error('Year plan not found');
      }
    
      // Update the nitrogen balance for the division in each relevant year
      for (const yearPlan of relevantYearPlans) {
        // Find the division in the current year plan
        const relevantDivision = yearPlan.rotationItems.find(item => item.division === division);
    
        if (relevantDivision) {
          relevantDivision.nitrogenBalance += nitrogenBalance;
        }
      }
    
      // Find the division in the last year plan
      const lastYearPlan = relevantYearPlans[relevantYearPlans.length - 1];
      const lastYearDivision = lastYearPlan.rotationItems.find(item => item.division === division);
    
      if (lastYearDivision && lastYearDivision.crop) {
        // Find the crop and update its soilResidualNitrogen
        const crop = rotation.crops.find(crop => crop._id.toString() === lastYearDivision.crop.toString());
        if (crop) {
          crop.soilResidualNitrogen = lastYearDivision.nitrogenBalance;
          await crop.save();
        }
      }
    
      // save the updated rotation
      await rotation.save();
    
      res.status(200).json({
        status: 'success',
        data: {
          rotation
        }
      });
    });

    public updateDivisionSizeAndRedistribute = asyncHandler(async (req: CustomRequest, res: Response) => {
      const { rotationName, division, newDivisionSize } = req.body;
      
      // Find the rotation for the given id
      const rotation = await Rotation.findOne({ rotationName });
    
      if (!rotation) {
        res.status(404);
        throw new Error('Rotation not found');
      }
    
      // Check if newDivisionSize is valid
      if (newDivisionSize > rotation.fieldSize || newDivisionSize < 0) {
        res.status(400);
        throw new Error('Invalid division size');
      }
    
      // Calculate the remaining size to be distributed among the other divisions
      const remainingSize = rotation.fieldSize - newDivisionSize;
    
      // Calculate the size for the other divisions
      const otherDivisionsSize = remainingSize / (rotation.numberOfDivisions - 1);
    
      // Iterate over all the years
      for (const yearPlan of rotation.rotationPlan) {
        // Iterate over all divisions in a year
        for (const rotationItem of yearPlan.rotationItems) {
          if (rotationItem.division === division) {
            // Update the specified division size
            rotationItem.divisionSize = newDivisionSize;
            rotationItem.directlyUpdated = true; // marking division as directly updated
          } else if (!rotationItem.directlyUpdated) {
            // Update the other divisions' size only if they haven't been directly updated
            rotationItem.divisionSize = otherDivisionsSize;
          }
        }
      }
    
      // save the updated rotation
      await rotation.save();
    
      res.status(200).json({
        status: 'success',
        data: {
          rotation
        }
      });
    });


   public getCropRotation =  asyncHandler(async (req: CustomRequest, res: Response) => {
    const cropRotation = await Rotation.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (cropRotation && cropRotation.length > 0) {
      res.json(cropRotation);
    } else {
      res.status(204);
      res.json('No crop rotation found for this user');
    } 

  });




    public deleteCropRotation = asyncHandler(async (req: CustomRequest, res: Response) => {
      const cropRotation = await Rotation.findById(req.params.id);
    
      if (cropRotation) {
        await cropRotation.remove();
        res.json({ message: 'Rotation removed' });
      } else {
        res.status(404);
        throw new Error('Rotation not found');
      }
    });
  }

export default RotationController;

