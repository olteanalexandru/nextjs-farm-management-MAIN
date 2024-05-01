import {
    NextResponse, NextRequest
} from 'next/server';
import CropModel from '../../../../../Models/cropModel';
import Rotation from '../../../../../Models/rotationModel';
import User from '../../../../../Models/userModel';
import { connectDB } from '../../../../../../db';
import { getSession } from '@auth0/nextjs-auth0';
import type {  Crop,  CropRotationInput , CropRotationItem } from '../interfaces';

connectDB();

const usedCropsInYear: Map<number, Set<string>> = new Map();
async function cropIsAvailable(crop: Crop, year: number, lastUsedYear: Map<number, Map<Crop, number>>, division: number, userId: string): Promise<boolean> {
  
  const divisionLastUsedYear = lastUsedYear.get(division) || new Map<Crop, number>();
  const lastUsed = divisionLastUsedYear.get(crop) || 0;
  // Fetch user
  const user = await User.findOne({ auth0_id: userId });
  let maxRepetitions = user.selectareCounts[crop._id] 
  // Check selectareCounts for crop selection count
  if (year - lastUsed <= crop.ItShouldNotBeRepeatedForXYears && ((user.selectareCounts[crop._id] || 0) <= maxRepetitions || maxRepetitions < 1)) {
    return false;
  }
  // Check if crop was used in the same year
  if (usedCropsInYear.get(year)?.has(crop._id) ) {
    return false;
  }
  return true;
}
  
  //@route PUT /api/crops/recommendations
  //@acces Admin

  const generateCropRotation = async ( cropInput , userObj) => {

    const input: CropRotationInput = cropInput;
    let req = cropInput

    const {
      crops,
      fieldSize,
      numberOfDivisions,
      maxYears ,
      ResidualNitrogenSupply ,
  
    } = input
    const TheResidualNitrogenSupply = ResidualNitrogenSupply ?? 500;




    if (!crops || crops.length === 0) {
      console.log(`received input is ${JSON.stringify(input)}`);
      console.log(`destructed input is crops: ${crops}, fieldSize: ${fieldSize}, numberOfDivisions: ${numberOfDivisions}, maxYears: ${maxYears}, ResidualNitrogenSupply: ${ResidualNitrogenSupply}`);
      console.log(`req is ${JSON.stringify(req)}`);
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
          const sortedCrops = sortCropsByNitrogenBalance(crops, nitrogenPerDivision, 0);
          let crop;
          // Find a crop that is available and has no shared pests or diseases with the previous crop
          for (const c of sortedCrops) {
            const isAvailable = await cropIsAvailable(c, year, lastUsedYear, division, userObj.auth0_id );
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
  
            const nitrogenBalance = calculateNitrogenBalance(crop, nitrogenPerDivision, 0);
  
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
  
          if (cropIsAvailable(crop, year, lastUsedYear, division, userObj.auth0_id )) {
            lastUsedYear.get(division)?.set(crop, year);
            const plantingDate = new Date(crop.plantingDate);
            plantingDate.setFullYear(plantingDate.getFullYear() + year - 1);
            const harvestingDate = new Date(crop.harvestingDate);
            harvestingDate.setFullYear(harvestingDate.getFullYear() + year - 1);
            const soilResidualNitrogen: number = crop.soilResidualNitrogen ?? TheResidualNitrogenSupply;

            const nitrogenBalance = calculateNitrogenBalance(crop, crop.nitrogenSupply, soilResidualNitrogen);
  
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
      user: userObj.auth0_id,
      fieldSize,
      numberOfDivisions,
      rotationName : input.rotationName,
      crops: input.crops,
      rotationPlan: Array.from(rotationPlan.entries()).map(([year, rotationItems]) => ({ year, rotationItems })),
    });
    
    const createdRotation = await rotation.save();
    
    const cropsToUpdate = await CropModel.find({ _id: { $in: input.crops } });
    
    const user = await User.findOne({ auth0_id: userObj.auth0_id });
    if (!user) {
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
      return createdRotation
 
    } else {
  
      throw new Error('Failed to generate crop rotation');
    }
  };
  
  function sortCropsByNitrogenBalance(crops: Crop[], nitrogenPerDivision: number, soilResidualNitrogen: number) {
    return crops.sort((a, b) => {
      const balanceA = calculateNitrogenBalance(a, nitrogenPerDivision,  soilResidualNitrogen );
      const balanceB = calculateNitrogenBalance(b, nitrogenPerDivision,  soilResidualNitrogen );
      return balanceA - balanceB;
    });
  }
  
  function calculateNitrogenBalance(crop: Crop, nitrogenPerDivision: number, soilResidualNitrogen: number) {
    const nitrogenBalance = nitrogenPerDivision - crop.nitrogenDemand + soilResidualNitrogen;
    // No negative nitrogen balance
    const balance = nitrogenBalance < 0 ? 0 : nitrogenBalance;
    // Set nitrogen balance to 2 decimal places
    return parseFloat(balance.toFixed(2));
  }
  
  // @route PUT /api/crops/rotation/
  // @access Admin
  // @route PUT /api/crops/rotation/
  // @access Admin
  const updateNitrogenBalanceAndRegenerateRotation = async (Inputs) => {
    const { year, rotationName, division, nitrogenBalance } = Inputs;
    
    // Find the rotation for the given id
    const rotation = await Rotation.findOne({ rotationName }).populate('crops');
  
    if (!rotation) {
      throw new Error('Rotation not found');
    }
  
    // Get the rotation plans for the specific year and the following years
    const relevantYearPlans = rotation.rotationPlan.filter(item => item.year >= year);
  
    if (!relevantYearPlans.length) {
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

return rotation

  };


  // @route PUT /api/crops/rotation/divisionSize
// @access Admin
const updateDivisionSizeAndRedistribute = async (input) => {
  const { rotationName, division, newDivisionSize } = input

  // Find the rotation for the given id
  const rotation = await Rotation.findOne({ rotationName });
  if (!rotation) {
    throw new Error('Rotation not found');
  }
  // Check if newDivisionSize is valid
  if (newDivisionSize > rotation.fieldSize || newDivisionSize < 0) {
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
return rotation
}



  
  const deleteCropRotation = async (input) => {
    const cropRotation = await Rotation.findById(input.rotation._id);
  
    if (!cropRotation) {
      throw new Error('Crop rotation not found');
    }

    await cropRotation.remove();
return cropRotation
    }



// router.route('/cropSelect/:id').post(authCheck, cropControllerClass.setSelectare).put(authCheck, cropControllerClass.setSelectare)
// router.route('/cropRotation').post(authCheck, rotationControllerClass.generateCropRotation).get(authCheck, rotationControllerClass.getCropRotation).put(authCheck, rotationControllerClass.updateNitrogenBalanceAndRegenerateRotation)
// router.route('/cropRotation/fields').put(authCheck, rotationControllerClass.updateDivisionSizeAndRedistribute)
// router.route('/cropRotation/:id').get(authCheck, rotationControllerClass.getCropRotation)






//new api paths:

// API/Controllers/Rotation/[rotation]/[rotationRoutes]/[dinamicAction]/route.ts

//GET paths and params docs
// get crop rotation:
// API_URL + /Rotation/getRotation/ rotation / :id



export async function GET(request: NextRequest, context: any) {
    const { params } = context;
    const { user } = await getSession();
    console.log("reached get request")

    if (params.rotation == 'getRotation' && params.rotationRoutes == 'rotation') {
        const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
        const CheckuserObject = Checkuser.toObject();

        console.log("reached get request 2")

        if (user.sub !== CheckuserObject.auth0_id) {

            return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
        }

        const cropRotation = await Rotation.find({ user: user.sub }).sort({ createdAt: -1 });
        if (cropRotation && cropRotation.length > 0) {
            return NextResponse.json({
                data: cropRotation
            } , { status: 200 });
        } else {
            return NextResponse.json('No crop rotation found for this user', { status: 204 });
        }
    }
}



//POST paths and params docs
// generate crop rotation:
// API_URL + /Rotation/generateRotation/ rotation / :id
export async function POST(req: NextRequest, context: any) {
  const { params } = context;

  if (params.rotation == 'generateRotation' && params.rotationRoutes == 'rotation') {
    // Ensure session and user retrieval is handled correctly
    const session = await getSession();
    const user = session?.user;

    // Fetch the user based on dynamic action parameter
    const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
    if (!Checkuser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const CheckuserObject = Checkuser.toObject();
   

    // Check if the user from the session matches the fetched user
    if (user.sub !== CheckuserObject.auth0_id) {
      return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 401 });
    }

    try {
      // Await the parsing of the JSON body from the request
      const cropInput = await req.json();

     let response =   await generateCropRotation(cropInput, CheckuserObject);
      return NextResponse.json({
        message: 'Crop rotation generated successfully',
      
      } , { status: 201 });
    } catch (error) {
      // Handle parsing errors or other exceptions
      console.error('Error parsing request body:', error);
      return NextResponse.json({ message: error }, { status: 400 });
    }
  }
}



//PUT paths and params docs
// update nitrogen balance and regenerate rotation:
// API_URL + /Rotation/updateNitrogenBalance/ rotation / :id
// update division size and redistribute:
// API_URL + /Rotation/updateDivisionSizeAndRedistribute/ rotation / :id

export async function PUT(req: NextRequest, context: any) {
    const { params } = context;
    if (params.rotation == 'updateDivisionSizeAndRedistribute' && params.rotationRoutes == 'rotation') {
        const session = await getSession();
        const user = session?.user;

        const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
        const CheckuserObject = Checkuser.toObject();
        if (user.sub !== CheckuserObject.auth0_id) {
            return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
        }
        const rotation = await updateDivisionSizeAndRedistribute(req.body);
        return NextResponse.json(rotation);
    }
    if (params.rotation == 'updateNitrogenBalance' && params.rotationRoutes == 'rotation') {
        const session = await getSession();
        const user = session?.user;

        const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
        const CheckuserObject = Checkuser.toObject();
        if (user.sub !== CheckuserObject.auth0_id) {
            return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
        }
        const rotation = await updateNitrogenBalanceAndRegenerateRotation(req.body);
        return NextResponse.json(rotation);
    }
}

//DELETE paths and params docs
// delete crop rotation:

// API_URL + /Rotation/deleteRotation/ rotation / :id

export async function DELETE(req: NextRequest, context: any) {
    const { params } = context;
    if (params.rotation == 'deleteRotation' && params.rotationRoutes == 'rotation') {
        const session = await getSession();
        const user = session?.user;

        const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
        const CheckuserObject = Checkuser.toObject();
        if (user.sub !== CheckuserObject.auth0_id) {
            return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
        }
        const rotation = await deleteCropRotation(req.body);
        return NextResponse.json(rotation);
    }
}








 




