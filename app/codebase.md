# api/auth/[auth0]/route.ts

```ts
import { handleAuth } from '@auth0/nextjs-auth0';

export const GET = handleAuth();

// BF99X4UACE1UEP857PMNY46M
```

# api/Controllers/Crop/[crops]/[cropRoute]/[dinamicAction]/route.ts

```ts
import { NextResponse , NextRequest } from 'next/server';
import Crop from '../../../../../Models/cropModel';
import User from '../../../../../Models/userModel';
import UserCropSelection from '../../../../../Models/selectionModel';
import { connectDB } from '../../../../../../db';
import { getSession } from '@auth0/nextjs-auth0';

connectDB()


//GET paths and params docs
// for single crop 
// API_URL + "/crops/crop/id/" + id
// for all crops
// API_URL + "/crops/crops/retrieve/all"
// for search
// API_URL + "/crops/crops/search/" + searchWords
// for recommendations
// API_URL + "/crops/crops/recommendations/" + cropName


export async function GET(request: NextRequest, context: any) {

   const { params } = context;
   const session = await getSession();
   const user = session?.user;
   let crops;
   let selections;
   let message = 'No more crops';
   console.log("user: " + user.sub + " JSON: " + JSON.stringify(user))
   if (params.crops === 'crops' && params.cropRoute == "search") {
      crops = await Crop.find({ cropName: { $regex: params.dinamicAction, $options: 'i' } });
      console.log("triggered crop")
      const filteredCrops = crops.filter((crop) =>
         crop.cropType && crop.cropVariety && crop.plantingDate && crop.harvestingDate && crop.soilType
       );
       return NextResponse.json({ crops: filteredCrops,  message });
   } else if (params.crops === 'crop' && params.cropRoute == "id") {

      console.log(" searched user " + params.dinamicAction.toString())
      crops = await Crop.find({ _id: params.dinamicAction.toString() })
      message = `crop with id ${params.dinamicAction}  found`;
      const filteredCrops = crops.filter((crop) =>
         crop.cropType && crop.cropVariety && crop.plantingDate && crop.harvestingDate && crop.soilType
       );
       return NextResponse.json({ crops: filteredCrops,  message });
   } else if (params.crops === 'crops' && params.cropRoute == "recommendations") {
      crops = await Crop.find({ cropName: { $regex: params.dinamicAction, $options: 'i' } });
      crops.map((c) => ({
         cropName: c.cropName,
         diseases: c.diseases,
         pests: c.pests,
         nitrogenSupply: c.nitrogenSupply,
         nitrogenDemand: c.nitrogenDemand,
      }));
      console.log("triggered crop")
      return NextResponse.json({ crops, message });
   } else if (
      params.crops === 'crops' &&
      params.cropRoute == "retrieve" && params.dinamicAction == "all"
   ) {
      crops = await Crop.find();
       selections = await UserCropSelection.find();

       const filteredCrops = crops.filter((crop) =>
         crop.cropType && crop.cropVariety && crop.plantingDate && crop.harvestingDate && crop.soilType
       );
       return NextResponse.json({ crops: filteredCrops,selections, message });
   } else if (params.crops === 'crops' && params.cropRoute == "user" && params.dinamicAction == "selectedCrops" ) {

      crops = await Crop.find();
      selections = await UserCropSelection.find();


     let selectedCrops = selections.filter((selection) => selection.user === user.sub)
      .map(selection => ({
        count: selection.selectionCount,
        cropId: selection.crop
      }))
      .flatMap(({ count, cropId }) => {
        const crop = crops.find(crop => crop._id === cropId);
        return Array(count).fill(crop);
      });

      return   NextResponse.json({ selectedCrops });
   }
   console.log("crop get triggered")
 
}

//POST paths and params docs
// for single crop
// API_URL + "/crops/crop/id/" + id
// for recommendations
// API_URL + "/crops/crops/recommendations " + id

export async function POST(request: NextRequest,context: any) {


  const { params } = context;
  const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
  const CheckuserObject = Checkuser.toObject();
  const { user } = await getSession();
  // let user = await User.findOne(params.dinamicAction);
if (
  user.sub !== CheckuserObject.auth0_id  && params.cropRoute !== 'single' 
){
   console.log
  return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
}
  // post request for crop recommendations
  if (
      params.crops === 'crops' && params.cropRoute == "recommendations"  &&
      params.dinamicAction === user.sub
 
   ) {
      const { cropName, nitrogenSupply, nitrogenDemand, pests, diseases } = await request.json();
      let crop = await Crop.findOne({ cropName });
      

      if (!crop) {
         crop = new Crop({
         user: user.sub,
         cropName,
         nitrogenSupply,
         nitrogenDemand,
         pests,
         diseases,
         });
      } else {
         crop.nitrogenSupply = nitrogenSupply;
         crop.nitrogenDemand = nitrogenDemand;
         crop.pests = pests;
         crop.diseases = diseases;
      }
   

   
      const updatedCrop = await crop.save();
      return NextResponse.json(updatedCrop, { status: 200 });
      // post request for crop  --------------------------
      } else if (params.crops === 'crop' && params.cropRoute === 'single' ) {
         const requestBody = await request.json(); // Parse the entire JSON body
  const cropData = {
    ...requestBody, 
    user: user.sub 
  };
         if (
            !cropData.cropName || !cropData.cropType || !cropData.cropVariety || !cropData.plantingDate || !cropData.harvestingDate || !cropData.soilType  ){
               return NextResponse.json({ message: 'Incomplete body' }, { status: 400 });
            }
         
         console.log('Crop data:', cropData);
         const crop = await Crop.create(cropData);
         
         return NextResponse.json(crop, { status: 201 });
      } if (params.crops === 'crop' && params.cropRoute === 'selectare') {
         const crop = await Crop.findById(params.dinamicAction);
         if (!crop) {
             return NextResponse.json({ message: 'Crop not found' }, { status: 403 });
         }
 
         const { selectare, numSelections, _id } = await request.json();

         if (selectare === undefined || numSelections === undefined) {
            return NextResponse.json({ message: 'Missing selectare data' }, { status: 400 });
         }

         let selectareBy = _id;

         // Fetch user
         const user = await User.findById(selectareBy);

         if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 401 });
         }
         if (!user) {
             return NextResponse.json({ message: 'User not found' }, { status: 404 });
         }
 
          if (!selectare) {
             // Deselecting
             let selectare = false;
             selectareBy = null;
    
             // Remove crop id from user's selectedCrops
             user.selectedCrops = user.selectedCrops.filter((c) => c.toString() !== params.id);
             user.selectareCount = (user.selectareCount || numSelections) - numSelections;
          } else {
             // Selecting
             // Increment selection count for the user
             user.selectareCount = (user.selectareCount || 0) + numSelections;
 
             // Add crop id to user's selectedCrops
             for (let i = 0; i < numSelections; i++) {
                 if (!user.selectedCrops.includes(params.id)) {
                     user.selectedCrops.push(params.id);
                 }
             }
         }
 
         await user.save();
         const selectareCrop = await Crop.findByIdAndUpdate(params.id, { selectare: selectare, selectareBy: selectareBy, });
         return NextResponse.json(selectareCrop, { status: 200 });
     } else {
         return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
     }
 } 
   

//PUT paths and params docs
// for single crop
// API_URL + "/crops/crops/cropid/" + userid
// API_URL + "/crops/crops/id/" + id + "/recommendations"
// selectare 
// API_URL + "/crops/crops/selectare/" + id + "/selectare"

export async function PUT(request: NextRequest,context: any) {

   const { params } = context;
   const { user } = await getSession();
   if ( params.crops === 'crop'  ) {
  

      const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
   
      const CheckuserObject = Checkuser.toObject();
      const roles = Array.isArray(user.userRoles) ? user.userRoles : [user.userRoles];
   
    if (
      user.sub !== CheckuserObject.auth0_id && !roles.map(role => role.toLowerCase()).includes('admin')
    ){
   
      return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
    }
         const { cropName, nitrogenSupply, nitrogenDemand, pests, diseases } = await request.json();
         let crop = await Crop.findOne({_id : params.cropRoute});
  
         if (!crop) {
            return NextResponse.json({ message: 'Crop not found' }, { status: 404 });
         }
         if (!params.dinamicAction) {
            return NextResponse.json({ message: 'User not found' }, { status: 401 });
         }
         console.log( user.userRoles + "rolurile")

 // Check if the user is an admin or the owner of the crop
if (roles.map(role => role.toLowerCase()).includes('admin') || crop.user.toString() === user.sub) {
   // The user is either an admin or the owner of the crop, so no error should be sent
   console.log("Access granted: " + user.sub);
} else {
   // The user is not an admin and does not own the crop, so send an error
   console.log("User is not admin and the crop is not his: " + user.sub + " " + crop.user.toString());
   return NextResponse.json({ message: 'User not authorized, not admin and not his crop' }, { status: 401 });
}
         if (!crop) {
            crop = new Crop({
            user: params.dinamicAction,
            cropName,
            nitrogenSupply,
            nitrogenDemand,
            pests,
            diseases
            });
           } else {
            crop.nitrogenSupply = nitrogenSupply;
            crop.nitrogenDemand = nitrogenDemand;
            crop.pests = pests;
            crop.diseases = diseases;
           }
         const updatedCrop = await crop.save();
         return NextResponse.json(updatedCrop, { status: 200 });
    } else if (params.crops === 'crops' && params.dinamicAction === 'selectare') {

    if ( user === null || user === undefined  ){
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    
    }
  
console.log( "selectare triggered" + params.cropRoute + " " + params.dinamicAction)
      const crop = await Crop.findById(params.cropRoute.toString());
      if (!crop) {
         return NextResponse.json({ message: 'Crop not found' }, { status: 404 });
      }
      const { selectare, numSelections } = await request.json();
      if (selectare === undefined || numSelections === undefined) {
         return NextResponse.json({ message: 'Missing selectare data' }, { status: 400 });
      }
      let selectareBy = user.sub;
      // Fetch user
      const user2 = await User.findOne({ auth0_id: user.sub });

      let userCropSelection = await UserCropSelection.findOne({ user: user.sub, crop: crop._id });
  if (!userCropSelection) {
    userCropSelection = new UserCropSelection({ user: user.sub, crop: crop._id });
  }


      if (!selectare) {
         // Deselecting
         // let selectare = false;
         // selectareBy = null;
         // Remove crop id from user's selectedCrops
         userCropSelection.selectionCount = Math.max(0, userCropSelection.selectionCount - numSelections);
         user2.selectedCrops = user2.selectedCrops.filter((c) => c.toString() !== params.cropRoute);
         user2.selectareCount = (user2.selectareCount || numSelections) - numSelections;
      } else {
         // Selecting
         // Increment selection count for the user
         userCropSelection.selectionCount += numSelections;
         user2.selectareCount = (user2.selectareCount || 0) + numSelections;
         // Add crop id to user's selectedCrops
         for (let i = 0; i < numSelections; i++) {
            if (!user2.selectedCrops.includes(params.cropRoute)) {
               user2.selectedCrops.push(params.cropRoute);
            }
         }
      }

      await userCropSelection.save();
      await User.findOneAndUpdate({ auth0_id: user.sub }, user2);
      const selectareCrop = await Crop.findByIdAndUpdate(params.cropRoute, {  selectareBy: selectareBy });
      return NextResponse.json(selectareCrop, { status: 200 });
    }
   }



//DELETE paths and params docs
// for single crop
// API_URL + "/crops/crops/:UserId/" + :cropID
export async function DELETE(request: NextRequest, context: any) {
   
   const { params } = context;
   const Checkuser = await User.findOne({ auth0_id: params.cropRoute });
   const session = await getSession();
   const user = session?.user;

   const CheckuserObject = Checkuser.toObject();

//Checkuser.auth0_id is undefined here but it has value in the line above
if (!user || !Checkuser || user.sub !== CheckuserObject.auth0_id) {
   return NextResponse.json({ message: 'User not found / not the same user as in token' + user.sub + " " + (Checkuser ? CheckuserObject : 'Checkuser is undefined') }, { status: 404 });
 }

   if (params.crops === 'crops') {
      const crop = await Crop.findById(params.dinamicAction);
      if (!crop) {
         return NextResponse.json({ message: 'Crop not found' }, { status: 404 });
      }
      if (user.sub !== crop.user.toString()) {
         return NextResponse.json({ message: 'User not authorized' + user.sub + crop.user.toString() }, { status: 401 });
      }
      console.log("crop delete triggered" + crop);
    
      await crop.deleteOne()
      return NextResponse.json({ message: 'Crop deleted' }, { status: 200 });
   } 

}




 









```

# api/Controllers/Post/[posts]/[postsRoutes]/[dinamicAction]/route.ts

```ts
import { NextResponse, NextRequest } from 'next/server';
import Post from '../../../../../Models/postModel';
import User from '../../../../../Models/userModel';
import { connectDB } from '../../../../../../db';
import { getSession } from '@auth0/nextjs-auth0';

connectDB()


//paths :
// for single post
// API_URL + "/post/id/" + id
// for all posts
// API_URL + "/post/count/" + count
// for search
// API_URL + "/post/search/" + search
// for all posts
// API_URL + "/post"

export async function GET(request: Request, context: any) {
  const { params } = context;
  let posts;
  let message
  if (params.posts === 'posts' && params.postsRoutes == "count") {
    const limit = 5;
    const count = Number(params.dinamicAction) || 0;
    const skip = count * limit;
    posts = await Post.find().skip(skip).limit(limit);

    if (posts.length === 0) {
      //include a message for no more posts in posts
      message = "No more posts";
    }

  } else if (params.posts === 'posts' && params.postsRoutes == "search") {
    posts = await Post.find({ title: { $regex: params.dinamicAction, $options: 'i' } });
  } else if (params.posts === 'post' && params.postsRoutes == "id") {
    posts = await Post.findById(params.dinamicAction);
  } else if (
    params.posts === 'posts' &&
    params.postsRoutes == "retrieve" && params.dinamicAction == "all"

  ) {
    posts = await Post.find();
  }

  return NextResponse.json({ posts, message });
}


//POST paths and params docs
// for single post
// API_URL + "/post/new/" + Userid

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  const { title, brief, description, image } = await request.json();
  const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
  const CheckuserObject = Checkuser.toObject();
  const { user } = await getSession();

  if ( user.sub !== CheckuserObject.auth0_id) {
    return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
  }
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (
    !user.userRoles.toString().toLowerCase().includes("admin")
  ) {
    return NextResponse.json({ message: 'User not Admin' }, { status: 401 });
  }
  if (!title) {
    return NextResponse.json({ message: 'Title missing' }, { status: 400 });
  }
  if (!brief) {
    return NextResponse.json({ message: 'Brief missing' }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ message: 'Description missing' }, { status: 400 });
  }
  if (
    params.posts == "post" && params.postsRoutes == "new"
  ) {
    const post = new Post({
      user: user.sub,
      title,
      brief,
      description,
      image
    });
    await post.save();
    console.log("post post triggered")
    return NextResponse.json({ message: 'Post Created' }, { status: 201 });
  }
}

//PUT paths and params docs
// for single post
// API_URL + "/post/:postId/:userId"

export async function PUT(request: NextRequest, context: any) {
  const { params } = context;
  if (
    params.posts == "post"
  ) {
    const { title, brief, description, image } = await request.json();
    const post = await Post.findById(params.postsRoutes);
    const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
  const CheckuserObject = Checkuser.toObject();
    const { user } = await getSession();
    if (user === null || user.sub !== CheckuserObject.auth0_id) {
      return NextResponse.json({ message: 'User not authorized' }, { status: 401 });
    }
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (post.user.toString() !== user.sub.toString()) {
      return NextResponse.json({ message: 'User not authorized' }, { status: 401 });
    }
    post.title = title;
    post.brief = brief;
    post.description = description;
    post.image = image;
    await post.save();
    console.log("post put triggered")
    return NextResponse.json({ message: 'Post Updated' }, { status: 200 });
  }
}

//API
//DELETE paths and params docs
// for single post
// API_URL + "/post/:postId/:userId"

export async function DELETE(request: NextRequest, context: any) {

  const { params } = context;

  const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
  const CheckuserObject = Checkuser.toObject();
  const { user } = await getSession();

  if ( user.sub !== CheckuserObject.auth0_id) {
    return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
  }



  if (
    params.posts == "post" && params.postsRoutes
  ) {
    const post = await Post.findById(params.postsRoutes);
   
  
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (post.user.toString() == user.sub || user.role.toLowerCase().includes('admin')) {

      await post.deleteOne()
      console.log("post delete triggered")
      return NextResponse.json({ message: 'Post Deleted' }, { status: 200 });
    }
  }
}



```

# api/Controllers/Rotation/[rotation]/[rotationRoutes]/[dinamicAction]/route.ts

```ts
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
    const {id,  year, rotationName, division, nitrogenBalance } = Inputs;
    // Find the rotation for the given id
    const rotation = await Rotation.findById(id).populate('crops');
    if (!rotation) {
      throw new Error('Rotation not found' + id +" " + JSON.stringify(Inputs) );
    }
    const { user } = await getSession();
    if (rotation.user !== user.sub) {
      throw new Error('User not authorized to update this crop rotation');
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
      const crop = await rotation.crops.find(crop => crop._id.toString() === lastYearDivision.crop.toString());
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
  const {id, rotationName, division, newDivisionSize } = input

  // Find the rotation for the given id
  const rotation = await Rotation.findById(id)
  if (!rotation) {
    throw new Error('Rotation not found for ' + id + input.toString())
  }
  // Check if newDivisionSize is valid
  if (newDivisionSize > rotation.fieldSize || newDivisionSize < 0) {
    throw new Error('Invalid division size: ' + newDivisionSize +  " must not be above fieldsize: " + rotation.fieldSize);
  }

  const { user } = await getSession();
  if (rotation.user !== user.sub) {
    throw new Error('User not authorized to update this crop rotation');
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
    const cropRotation = await Rotation.findById(input);
  
    if (!cropRotation) {
      throw new Error('Crop rotation not found');
    }
    const { user } = await getSession();
    if (cropRotation.user !== user.sub) {
      throw new Error('User not authorized to delete this crop rotation');
    }
    await cropRotation.deleteOne(
      { _id: input }
    );

return cropRotation
    }

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

        console.log("reached get request getCrop")

        if (user.sub !== CheckuserObject.auth0_id) {

            return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 401 });
        }

        const cropRotation = await Rotation.find({ user: user.sub }).sort({ createdAt: -1 });
        if (cropRotation && cropRotation.length > 0) {
            return NextResponse.json({
                data: cropRotation
            } , { status: 200 });
        } else {
         
          return NextResponse.json({ message: 'No rotation for user 2' }, { status: 203 } );
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
      return NextResponse.json(response, { status: 200 });
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
        if (user.sub !== CheckuserObject.auth0_id ) {
            return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
        }
        try {
          let divisionNewSize = await req.json();
        const rotation = await updateDivisionSizeAndRedistribute(divisionNewSize);
        return NextResponse.json( rotation , { status: 200   });

      } catch (err) {
        console.error('Error parsing request body:', err);
        return NextResponse.json({ message: err.toString() }, { status: 400 });
      }
    }
    if (params.rotation == 'updateNitrogenBalance' && params.rotationRoutes == 'rotation') {
        const session = await getSession();
        const user = session?.user;
        const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
        const CheckuserObject = Checkuser.toObject();
        if (user.sub !== CheckuserObject.auth0_id ) {
            return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
        }

        console.log("reached put request ")
        try {
          let nitrogenToSuplement = await req.json();
        const rotation = await updateNitrogenBalanceAndRegenerateRotation(nitrogenToSuplement);
        return NextResponse.json({

            message: 'Nitrogen balance updated successfully',
            data: rotation
        } , { status: 200 }) 
      } catch (err) {
        console.error('Error parsing request body:', err);
        return NextResponse.json({ message: err.toString() }, { status: 400 });
      }
    }

}

//DELETE paths and params docs
// delete crop rotation:

// API_URL + /Rotation/deleteRotation/:userID / :Rotationid

export async function DELETE(req: NextRequest, context: any) {
    const { params } = context;
    if (params.rotation == 'deleteRotation' ) {

        const session = await getSession();
        const user = session?.user;
        const Checkuser = await User.findOne({ auth0_id: params.rotationRoutes.toString() });
        const CheckuserObject = Checkuser.toObject();
        if (user.sub !== CheckuserObject.auth0_id ) {
            return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
        }
        try {
          let rotationToDelete = params.dinamicAction;
        const rotation = await deleteCropRotation(rotationToDelete);
        return NextResponse.json({

            message: 'Rotation deleted successfully',
            data: rotation
        } , { status: 200 })
    } catch (err) {
        console.error('Error parsing request body:', err);
        return NextResponse.json({ message: err.toString() }, { status: 400 });
      }
    }

  }








 





```

# api/Controllers/Rotation/[rotation]/[rotationRoutes]/interfaces.ts

```ts



export interface Crop {
  cropName: string;
  cropType: string;
  cropVariety: string;
  plantingDate: string;
  harvestingDate: string;
  description?: string;
  selectare?: boolean;
  imageUrl?: string;
  soilType?: string;
  climate?: string;
  ItShouldNotBeRepeatedForXYears: number;
  _id: string;
  pests?: string[];
  diseases?: string[];
  doNotRepeatForXYears: number;
  fertilizers?: string[];
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilResidualNitrogen: number | undefined | null;
  id: number;
  name: string;
  fieldSize: number;
  numberOfDivisions: number;
  rotationName: string;
  crops: Crop[];
  division: number;
  maxYears: number;
}

export interface CropRotationInput {
  rotationName: string;
  crops: Crop[];
  fieldSize: number;
  numberOfDivisions: number;
  maxYears: number;
  TheResidualNitrogenSupply?: number;
  ResidualNitrogenSupply?: number;
  startYear?: number;
  lastUsedYear ?: Map<number, Map<Crop, number>>
  lastUsedYearInput ?: Map<number, Map<Crop, number>>
 
}

export interface Rotation {
  user: string;
  fieldSize: number;
  numberOfDivisions: number;
  rotationName: string;
  crops: Crop[];
  _id: string;
}

export interface CropRotationItem {
  division: number;
  crop: string | string[] | undefined | any;
  plantingDate: string;
  harvestingDate: string;
  divisionSize: number;
  nitrogenBalance?: number;
}



```

# api/Controllers/SetLanguage/route.ts

```ts
// /api/set-language.js

import { NextResponse, NextRequest } from 'next/server';



export async function POST(request: NextRequest, context: any) {
    const { params } = context;
    const { locale } = await request.json();
    const response = NextResponse.next();

    response.cookies.set('language', locale, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 12, // 2 weeks
        sameSite: 'strict',

    });
    return NextResponse.json({ message  : 'Language set to ' + locale }, { status: 201 });

}








// pages/api/SetLanguage/route.ts

```

# api/Controllers/User/[Action]/route.ts

```ts
import { NextResponse, NextRequest } from 'next/server';
import User from '../../../Models/userModel';
import { connectDB } from '../../../../db';
import { getSession } from '@auth0/nextjs-auth0';

connectDB()

    export async function GET(request:NextRequest,context: any){
        const { params } = context;
        if(params.Action === 'fermieri'){
            const session = await getSession();
            const sessionUser = session?.user;
            if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
              }

            const fermierUsers = await User.find({ role: 'farmer' }) as  any;
            console.log(fermierUsers)
            return NextResponse.json(fermierUsers, { status: 200 });
        } 
        if(params.Action === "admin"){
            const session = await getSession();
            const user = session?.user;
            if (user.userRoles.includes('Admin') === false) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
              }
            const adminUsers = await User.find({ role: 'admin' }) as  any;
            return NextResponse.json(adminUsers, { status: 200 });
        }
    }
    export async function POST(request:NextRequest,context: any){ 
            const { params } = context;
            if(params.Action === 'register'){
                const session = await getSession()
                const sessionUser = session?.user;
                if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                    console.log(sessionUser.userRoles)
                    return NextResponse.json({ message: 'User is not admin' }, { status: 400 });
                }
                const { name, email,  role } = await request.json();

                const user = await User.create({
                    name,
                    email,
                    role: role.toLowerCase()
                });
                return NextResponse.json(user, { status: 201 });
            } else if (params.Action === 'changeRole') {
                const session = await getSession();
                const sessionUser = session?.user;
                if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                    return NextResponse.json({ message: 'User is not admin' }, { status: 401 });
                } 
                const { email, role } = await request.json();
                if (role !== 'admin' && role !== 'farmer') {
                    return NextResponse.json({ message: 'Role is invalid' }, { status: 400 });
                }
                const user = await User
                    .findOneAndUpdate({
                        email
                    }, {
                        role
                    }, {
                        new: true
                    });
                return NextResponse.json(user, { status: 201 });
            }
    }




export async function PUT(request:NextRequest,context: any){    
                const { params } = context;
                if(params.Action === 'fermieri'){
                    const session = await getSession()
                    const sessionUser = session?.user;
                    if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                        return NextResponse.json({ message: 'User not found' }, { status: 404 });
                    }
                    const { name, email,  role } = await request.json();
                    const user = await User.create({
                        name,
                        email,
                        role,
                    });
                    return NextResponse.json(user, { status: 201 });
                }
            }

export async function DELETE(request:NextRequest,context: any){
                    const { params } = context;
                
                        const session = await getSession()
                        const sessionUser = session?.user;
                        if (sessionUser.userRoles.map((role: string) => role.toLowerCase()).includes('admin') === false ) {
                            return NextResponse.json({ message: 'User not found' }, { status: 404 });
                        }
                        
                        const user = await User.findById(params.Action);
                        if (user) {
                            await user.remove();
                          NextResponse.json({ message: 'User removed' }, { status: 200 });
                        } else {
                           NextResponse.json({ message: 'User not found' }, { status: 404 });
                            throw new Error('User not found');
                        }
                    
                    }
                








```

# api/Models/cropModel.ts

```ts
import mongoose from "mongoose";


const cropSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    ref: 'User',
  },
  selectare: {
    type: Boolean,
    required: false,
  },
  selectareBy: {
    type: String,
    required: false,
    ref: 'User',
  },
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
  },
  cropType: {
    type: String,
    required: false,
  },
  cropVariety: {
    type: String,
    required: false,
  },
  plantingDate: {
    type: String,
    required: false,
  },
  harvestingDate: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  imageUrl: {
    type: String, // Ensure the data type matches how it's used in the controller
    required: false,
  },
  soilType: {
    type: String,
    required: false,
  },
  climate: {
    type: String,
    required: false,
  },
  ItShouldNotBeRepeatedForXYears: {
    type: Number,
    required: false,
  },
  fertilizers: {
    type: [String],
    required: false,
  },
  pests: {
    type: [String],
    required: false,
  },
  diseases: {
    type: [String],
    required: false,
  },
  nitrogenSupply: {
    type: Number,
    required: false,
  },
  nitrogenDemand: {
    type: Number,
    required: false,
  },
  soilResidualNitrogen: {
    type: Number,
    required: false,
  },
},
  {
    timestamps: true,
  });

export default mongoose.models.Crop || mongoose.model('Crop', cropSchema);



// https://copilot.microsoft.com/sl/cESMsv8irQW
```

# api/Models/postModel.ts

```ts
import mongoose from "mongoose"


    const postSchema = new mongoose.Schema({
        //linking to user
        user: {
            type: String,
            required: true,
            ref: 'User',
        },
    title: {
        type: String,
        required: true,
    },
    brief: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
})

export default mongoose.models.Post || mongoose.model('Post', postSchema)




```

# api/Models/rotationModel.ts

```ts
//export 
export {};
const mongoose = require('mongoose');
import Crop from './cropModel';
import { connectDB } from '../../db';
connectDB()

const rotationItemSchema = mongoose.Schema({
  division: {
    type: Number,
    required: true,
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
  },
  cropName: {
    type: String,
  },
  plantingDate: {
    type: String,
    required: true,
  },
  harvestingDate: {
    type: String,
    required: true,
  },
  divisionSize: {
    type: Number,
    required: true,
  },
  nitrogenBalance: {
    type: Number,
    required: true,
  },
  directlyUpdated: { 
    type: Boolean,
    default: false, 
  },
});

const rotationYearSchema = mongoose.Schema({
  year: {
    type: Number,
    required: true,
  },
  rotationItems: [rotationItemSchema],
});

const rotationSchema = mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      ref: 'User',
    },
    fieldSize: {
      type: Number,
      required: [true, 'Field size is required'],
    },
    numberOfDivisions: {
      type: Number,
      required: [true, 'Number of divisions is required'],
    },
    rotationName: {
      type: String,
      required: [true, 'Rotation name is required'],
    },
    crops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
      },
    ],
    rotationPlan: [rotationYearSchema],
  },
  {
    timestamps: true,
  }
);


// Populate crops in rotation plan with crop names and crop varieties before sending response to client  
// rotationItemSchema.pre('save', function (next) {
//   if (this.crop) {
//     Crop.findById(this.crop, (err, crop) => {
//       if (err) return next(err);
//       this.cropName = crop.cropName;
//       next();
//     });
//   } else {
//     next();
//   }
// });

export default mongoose.models.Rotation || mongoose.model('Rotation', rotationSchema);
```

# api/Models/selectionModel.ts

```ts
import mongoose from "mongoose"



const UserCropSelectionSchema = new mongoose.Schema({
    user: {
        type: String,
      ref: 'User',
      required: true
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true
    },
    selectionCount: {
      type: Number,
      default: 0
    }
  });

export default mongoose.models.UserCropSelection || mongoose.model('UserCropSelection', UserCropSelectionSchema)
```

# api/Models/userModel.ts

```ts

import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: {
      values: ['farmer', 'admin'],
    },
    required: [true, '{VALUE} is not supported or missing']
  },
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email '],
    unique: true
  },
  selectedCrops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop'
  }],

  selectareCounts: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
},
  {
    timestamps: true
  });

export default mongoose.models.User || mongoose.model('User', userSchema)

```

# api/oauth/token/page.ts

```ts
var axios = require("axios").default;

require('dotenv').config();

var options = {
    method: 'POST',
    url: 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    data: new URLSearchParams({
        grant_type: process.env.GRANT_TYPE,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        audience: process.env.AUDIENCE
    })
};

axios.request(options).then(function (response) {
  console.log(response.data);
}).catch(function (error) {
  console.error(error);
});


console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");
```

# componets/GridGen.tsx

```tsx

import {chunk} from 'lodash';
import * as React from 'react';

interface GridGeneratorProps {
    cols?: number;
    children: React.ReactNode;
}
type GridGeneratorType = React.FC<GridGeneratorProps>;


const GridGenerator: GridGeneratorType = ({ children, cols = 3 }) => {
    const rows = chunk(React.Children.toArray(children), cols);
    return (
        <div>
            {rows.map((row  , i) => (
                <div key={i} className="row">
                    {row.map((col, j) => (
                        <div key={j} className="col">
                            {col}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GridGenerator;
```

# componets/hero.tsx

```tsx
export function Hero() {
  return (

      <div>
      
<section id="hero" className="d-flex align-items-center">
    <div className="container position-relative" data-aos="fade-up" data-aos-delay="100">
      <div className="row justify-content-center">
        <div className="col-xl-7 col-lg-9 text-center">
          <h1>Prototip Platforma agricola</h1>
          <h2>Platforma agricola care are de aface cu agricultura</h2>
        </div>
      </div>
      <div className="text-center">
        <a href="/desprenoi" className="btn-get-started scrollto">Vezi mai multe</a>
      </div>

      <div className="row icon-boxes">
        <div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0" data-aos="zoom-in" data-aos-delay="200">
          <div className="icon-box">
            <div className="icon"><i className="ri-stack-line"></i></div>
            <h4 className="title"><a href="">Lorem Ipsum</a></h4>
            <p className="description">Voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0" data-aos="zoom-in" data-aos-delay="300">
          <div className="icon-box">
            <div className="icon"><i className="ri-palette-line"></i></div>
            <h4 className="title"><a href="">Sed ut perspiciatis</a></h4>
            <p className="description">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0" data-aos="zoom-in" data-aos-delay="400">
          <div className="icon-box">
            <div className="icon"><i className="ri-command-line"></i></div>
            <h4 className="title"><a href="">Magni Dolores</a></h4>
            <p className="description">Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0" data-aos="zoom-in" data-aos-delay="500">
          <div className="icon-box">
            <div className="icon"><i className="ri-fingerprint-line"></i></div>
            <h4 className="title"><a href="">Nemo Enim</a></h4>
            <p className="description">At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis</p>
          </div>
        </div>

      </div>
    </div>
  </section>
</div>
    )
  }


```

# componets/LanguageSwitch.tsx

```tsx
import React from 'react';
import Cookies from 'js-cookie';

export const LanguageSwitch = () => {
    const setLocale = async (locale) => {
      // Set the cookie on the client side for immediate effect
      Cookies.set('language', locale);
      window.location.reload();
  
      // Make a request to the backend to set the cookie
      await fetch('/api/set-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale })
      });
    };
  
    const language = Cookies.get('language');
    console.log(language);
  
    return (
      <div>
        <button
          style={{
            background: 'none',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            display: 'block',
            marginBottom: '0px' // Add spacing between buttons
          }}
          onClick={() => {
            setLocale('ro');
          }}
        >
          RO
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            display: 'block'
          }}
          onClick={() => {
            setLocale('en');
          }}
        >
          EN
        </button>
      </div>
    );
  };              
```

# componets/Mail.tsx

```tsx
'use client'
export default function Mail() {
return (

<div className="input-group">
<input type="email" name="email" placeholder="Email" />
 <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Subscribe</button> 
</div>

);}
```

# componets/shared/index.ts

```ts

```

# Context/culturaStore.tsx

```tsx
"use client";
import { createContext, useContext } from 'react';
import axios from 'axios';
import { useSignals  } from "@preact/signals-react/runtime";
import { signal } from "@preact/signals-react";
import { useUser } from '@auth0/nextjs-auth0/client';

// const API_URL = 'http://localhost:3000/api/Controllers/Crop/';
// const API_URL_ROTATION = 'http://localhost:3000/api/Controllers/Rotation/';
const API_URL = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/Crop/';
const API_URL_ROTATION = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/Rotation/';

type DataType = {
  
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
  plantingDate: string;
  harvestingDate: string;
  description: string;
  imageUrl: string;
  soilType: string;
  fertilizers: string[];
  pests: string[];
  diseases: string[];
  selectare: boolean;
  user: string;
  token: string;
  ItShouldNotBeRepeatedForXYears: number;
  nitrogenSupply: number;
  nitrogenDemand: number;
  residualNitrogen: number;

};

type RecommendationType = {
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];

};

interface ContextProps {
  crops: any;
  selections: any;
  isLoading: any;
  isError: any;
  isSuccess: any;
  message: any;
  createCrop: (data: DataType) => Promise<void>;
  getCrops: () => Promise<void>;
  deleteCrop: (cropId: string) => Promise<void>;
  selectare: (cropId: number, selectare: boolean, numSelections: number) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (cropId: string, data: DataType) => Promise<void>;
  areThereCrops: any;
  setCropRotation: any;
  generateCropRotation: (fieldSize: number, numberOfDivisions: number, rotationName: string, crops: DataType, maxYears: number, ResidualNitrogenSupply: number) => Promise<void>;
  getCropRecommendations: (cropName: string) => Promise<any>;
  getCropRotation: () => Promise<void>;
  deleteCropRotation: (id: string) => Promise<void>;
  cropRotation: any;
  singleCrop: any;
  updateNitrogenBalanceAndRegenerateRotation: (data: any) => Promise<void>;
  updateDivisionSizeAndRedistribute: (data: any) => Promise<void>;
  addTheCropRecommendation: (data: RecommendationType) => Promise<void>;
  isCropRotationLoading: any;

}



interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {

const cropsSignal = signal([]);
const loadingSignal = signal(false);
const isErrorSignal = signal(false);
const isSuccessSignal = signal(false);
const messageSignal = signal('');
const cropRotationSignal = signal([]);
const singleCropSignal = signal(null);
const areThereCropsSignal = signal(false);
const selectionsSignal = signal([]);
const userStatus = signal(false);

const { user, error: authError, isLoading: isUserLoading  } = useUser();

userStatus.value = isUserLoading;



const getCropRotation = async () => {
 // useSignals(); 
  // Wait until isUserLoading is false
  loadingSignal.value = true;
    try {
    console.log("making a get request to get crop rotation try");
    const response = await axios.get(API_URL_ROTATION + "getRotation/rotation/" + user.sub);
    if (response.status === 200 || response.status === 203) {
      cropRotationSignal.value = response.data;
      console.log("crop rotation fetched 1 " + response?.data + response?.data?.message );
    } 
  } catch (err) {
    console.error(err);
  } finally {
    loadingSignal.value = false

  
  }

  console.log( "crop rotation fetched signal " + cropRotationSignal.value?.message);

};


const createCrop = async (data) => {
  console.log('createCrop triggered with object props: ' + JSON.stringify(data));
  loadingSignal.value = true
  try {
    const response = await axios.post(`${API_URL}crop/single/${user.sub}`, data);
    if (response.status === 201) {
      isSuccessSignal.value = true
      messageSignal.value ='Crop created successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error creating crop';
    }
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};

const updateCrop = async (cropId: string, data: DataType) => {

  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL}crop/${cropId}/${user.sub}`, data, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value ='Crop updated successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error updating crop';
    }
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};
const getCrops = async () => {


  console.log("getting crops..")
  try {
    loadingSignal.value = true
    const response = await axios.get(`${API_URL}crops/retrieve/all`, {});

    if (response.status === 200) {
      const newCrops = response.data.crops;
      if (newCrops !== cropsSignal.value) {
        cropsSignal.value = newCrops;
        areThereCropsSignal.value = true
      }
    } else {
      const newCrops = response.data.crops;
      if (newCrops !== cropsSignal.value) {
        cropsSignal.value = newCrops;
        isErrorSignal.value = true
        messageSignal.value = 'Error getting crops';
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    loadingSignal.value = false
  }

  console.log("crops are done in getCrops: " + !loadingSignal.value)
};

const deleteCrop = async (cropId: string) => {


  loadingSignal.value = true
  try {
    const response = await axios.delete(`${API_URL}crops/${user.sub}/${cropId}`, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = 'Crop deleted successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error deleting crop';
    }
  } catch (err) {
    console.error(err)
  } finally {
  loadingSignal.value = false
  }
};

const selectare = async (cropId: number, selectare: boolean, numSelections: number) => {


  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL}crops/${cropId}/selectare`, { selectare: selectare, numSelections: numSelections }, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = 'Crop selected successfully';
    } 
  } catch (err) {
    console.error(err)
  }  finally {
  loadingSignal.value = false
  } 
};

const SinglePage = async (id: string) => {

  
  loadingSignal.value = true
  try {
    const response = await axios.get(`${API_URL}crop/id/${id}`, {});
    if (response.status === 200) {
      const data = await response.data;
      isSuccessSignal.value = true
      singleCropSignal.value = data.crops[0];
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error in single page crop';
    }
  } catch (err) {
    console.error(err)
  }finally {
    loadingSignal.value = false
    }
console.log("the state of loading is " + loadingSignal.value)
};

  const addTheCropRecommendation = async (data: RecommendationType) => {
    loadingSignal.value = true
    try {
      const response = await axios.post(`${API_URL}crops/recommendations/${user.sub}`, data, {});
      if (response.status === 201) {
        isSuccessSignal.value = true
        messageSignal.value ='Recommendation added successfully';
      } 
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false
  };
  
  const generateCropRotation = async (
    fieldSize: number,
    numberOfDivisions: number,
    rotationName: string,
    crops: DataType,
    maxYears: number,
    ResidualNitrogenSupply: number,
  ) => {

    loadingSignal.value = true
  
    try {
      const response = await axios.post(
        `${API_URL_ROTATION}generateRotation/rotation/${user.sub}`,
        { 
          fieldSize, 
          numberOfDivisions,
          rotationName,
          crops,
          maxYears,
          ResidualNitrogenSupply,
        },
        {}
      );
      if (response.status === 200 || response.status === 201) {
        cropRotationSignal.value = response.data;
      } 
    } catch (err) {
      console.error(err);
    } finally {
    loadingSignal.value = false
    getCropRotation();
  
    }
  };
  

  const getAllCrops = async () => {


    try {
      loadingSignal.value = true
      const response = await axios.get(`${API_URL}crops/retrieve/all`, {});
      loadingSignal.value = false
      if (response.status === 200) {
        console.log("getting all crops..")
        const data = await response.data;
        cropsSignal.value = data.crops;
        areThereCropsSignal.value = true
        selectionsSignal.value = data.selections;
       
      }  else {
        cropsSignal.value = response.data.crops;
        isErrorSignal.value = true
        messageSignal.value = 'Error getting crops';
      }
    } catch (err) {
      console.error(err)
      areThereCropsSignal.value = false
    } finally {
      loadingSignal.value = false
    }
    console.log("crops are done fetching loading  signal is: " +  loadingSignal)
  };
  
  const deleteCropRotation = async (id: string) => {

    const confirmDelete = window.confirm("Are you sure you want to delete this crop rotation?");
    if (!confirmDelete) {
      return;
    }
    loadingSignal.value = true
    try {
      const response = await axios.delete(`${API_URL_ROTATION}deleteRotation/${user.sub}/${id}`, {});
      if (response.status === 200) {
        isSuccessSignal.value = true
        messageSignal.value = ('Crop rotation deleted successfully');
      } 
    } catch (err) {
      console.error(err)
    }
    loadingSignal.value = false
  };
  
  const getCropRecommendations = async (cropName: string) => {


    let recommendations = [];
    if (cropName !== '') {
      try {
        const response = await axios.get(`${API_URL}/crops/recommendations/${cropName}`, {});
        if (response.status === 200) {
          recommendations = response.data.crops;
        }
      } catch (error) {
        console.error(error);
      }
    }
    console.log("recommendations: ", recommendations);
    return recommendations;
  };
  
  
  const updateNitrogenBalanceAndRegenerateRotation = async (data: any) => {
    const { id, rotationName, year, division, nitrogenBalance } = data;
    loadingSignal.value = true
    try {
      const response = await axios.put(`${API_URL_ROTATION}updateNitrogenBalance/rotation/${user.sub}`, {id, year, rotationName, division, nitrogenBalance }, {});
      if (response.status === 200) {
        isSuccessSignal.value = true
        messageSignal.value = ('Nitrogen Balance and Crop Rotation updated successfully');
        cropRotationSignal.value =(response.data);
      } 
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false
  };
  

const updateDivisionSizeAndRedistribute = async (data: any) => {
  const { id, rotationName, division, newDivisionSize } = data;
  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL_ROTATION}updateDivisionSizeAndRedistribute/rotation/${user.sub}`, {id, rotationName, division, newDivisionSize }, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = ('Division Size and Crop Rotation updated successfully');
      cropRotationSignal.value = (response.data);
    } 
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};

  return (
    <GlobalContext.Provider
    value={{
      crops: cropsSignal,
      selections: selectionsSignal,
      isLoading: loadingSignal,
      isError: isErrorSignal,
      isSuccess: isSuccessSignal,
      message: messageSignal,
      createCrop,
      getCrops,
      deleteCrop,
      selectare,
      SinglePage,
      getAllCrops,
      updateCrop,
      areThereCrops: areThereCropsSignal,
      setCropRotation: cropRotationSignal,
      generateCropRotation,
      getCropRecommendations,
      getCropRotation,
      deleteCropRotation,
      cropRotation: cropRotationSignal,
      singleCrop: singleCropSignal,
      updateNitrogenBalanceAndRegenerateRotation,
      updateDivisionSizeAndRedistribute,
      addTheCropRecommendation,
    
      
    }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContextCrop = () => {
  return useContext(GlobalContext);
};

// Path: app\features\Context\culturaStore.tsx


```

# Context/postStore.tsx

```tsx
"use client";
import { createContext, useContext, Dispatch , SetStateAction , useState } from 'react';
import axios from 'axios'
import { useUser } from '@auth0/nextjs-auth0/client';

//const API_URL = 'http://localhost:3000/api/Controllers/Post'
const API_URL = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/Post'
type DataType = {
    id: string;
    _id: string;
    title: string;
    brief: string;
    description: string;
    image: string;
    user: string;
    token: string;
}
interface ContextProps {
    data: any;
    setData: Dispatch<SetStateAction<any>>;
    error: string;
    setError: Dispatch<SetStateAction<string>>;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    createPost: ( data: DataType , token:string   ) => Promise<void>;
    updatePost: (id: string , title: string, brief: string, description: string, image: string) => Promise<void>;
    deletePost: (_id: string, token:string) => Promise<void>;
    getPost: (id: string) => Promise<void>;
    getAllPosts: (count : number) => Promise<void>;
    clearData: () => void;
   
}

const ContextProps  = createContext<ContextProps>({
    data: [],
    setData: () => {},
    error: '',
    setError: () => {},
    loading: false,
    setLoading: () => {},
    createPost: () => Promise.resolve(),
    modify: () => Promise.resolve(),
    deletePost: () => Promise.resolve(),
    getPost: () => Promise.resolve(),
    getAllPosts: () => Promise.resolve(),
    clearData: () => {},
});
interface Props {
    children: React.ReactNode;
    }

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {

    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const { user, error: authError, isLoading: isUserLoading  } = useUser();


    const createPost = async ({ title, brief, description, image }: any) => {
        setLoading(true);
        try {
          const response = await axios.post(API_URL + "/post" + "/new/" + user.sub, {
            title,
            brief,
            description,
            image,
          }, {
      
          });
          const data = await response.data;
          if (data.error) {
            setError(data.error);
            setLoading(false);
            console.log(data.error)
          } else {
            setData((prevData) => [...prevData, data]);
            setLoading(false);
    
          }
        } catch (error: any) {
          setError(error.response.data.message);
          setLoading(false);
        }
      }


    const updatePost = async (postId: string, { title, brief, description, image }: any) => {
        setLoading(true);
        try {
            const response = await axios.put(API_URL + "/post/" + postId + "/" + user.sub , {
                title,
                brief,
                description,
                image,
            }, {
            });
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }
 


    const deletePost = async (postId: string) => {
        setLoading(true);
        try {

            const response = await axios.delete(API_URL + "/post/" + postId + "/" + user.sub); {
            }
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }




    const getPost = async (id: string) => {
        //solved
        setLoading(true);
        try {
            const response = await axios.get(API_URL + "/post/id/" + id);
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
               
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }

    
   
    const getAllPosts = async (count: number) => {
        //solved
        setLoading(true);
        try {
            const url = count ? API_URL + "/posts/count/" + count : API_URL + "/posts/retrieve/all";
            const response = await axios.get(url);
            const data = await response.data;
            console.log("it did trigger")
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else if (data.message === "No more posts") {
                setError(data.message);
                setLoading(false);
            } else {
                setData((prevData: any) => {
                    if (Array.isArray(prevData)) {
                        return [...prevData, ...data.posts];
                    } else {
                        return [...data.posts];
                    }
                });
                setLoading(false);
            }
            
        } catch (error: any) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }


    const clearData = () => {
        setData([]);
        setError('');
    }

    
    



    return (
        <GlobalContext.Provider
         value={{ 
        data,
        setData,
        error,
        setError,
        loading,
        setLoading,
        getPost,
        getAllPosts,
        createPost,
        updatePost,
        deletePost,
        clearData
         }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContextPost = () =>{
    return useContext(GlobalContext);
} 



```

# Context/rotationStore.tsx

```tsx
"use client";
import { createContext, useContext, Dispatch, SetStateAction, useState, useCallback } from 'react';
import axios from 'axios';

// const API_URL_cropRotation = 'http://localhost:5000/api/crops/cropRotation/';
// const API_URL_cropRecommendations = 'http://localhost:5000/api/crops/cropRecommendations';
// const API_URL_CropFields = 'http://localhost:5000/api/crops/cropRotation/fields';

const API_URL_cropRotation = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/crops/cropRotation/';
const API_URL_cropRecommendations = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/crops/cropRecommendations';
const API_URL_CropFields = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/crops/cropRotation/fields';

type DataType = {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
  plantingDate: string;
  harvestingDate: string;
  description: string;
  imageUrl: string;
  soilType: string;
  fertilizers: string[];
  pests: string[];
  diseases: string[];
  selectare: boolean;
  user: string;
  token: string;
  ItShouldNotBeRepeatedForXYears: number;
  nitrogenSupply: number;
  nitrogenDemand: number;
  residualNitrogen: number;
};

type RecommendationType = {
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
};

interface ContextProps {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isError: boolean;
  setIsError: Dispatch<SetStateAction<boolean>>;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  cropRotation: any;
  setCropRotation: Dispatch<SetStateAction<any>>;
  generateCropRotation: ( fieldSize: number, numberOfDivisions: number, rotationName: string, filteredCrops: any, token: string , maxYears: number, ResidualNitrogenSupply: number ) => Promise<void>;
  addTheCropRecommendation: (data: RecommendationType, token: string) => Promise<void>;
  getCropRotation: (token: string) => Promise<void>;
  updateNitrogenBalanceAndRegenerateRotation: (token:string , data: DataType) => Promise<void>;
  updateDivisionSizeAndRedistribute: (token:string , data: DataType) => Promise<void>;
}

const ContextProps = createContext<ContextProps>({
  isLoading: false,
  setIsLoading: () => {},
  isError: false,
  setIsError: () => {},
  isSuccess: false,
  setIsSuccess: () => {},
  message: '',
  setMessage: () => {},
  cropRotation: [],
  setCropRotation: () => {},
  generateCropRotation: () => Promise.resolve(),
  getCropRotation: () => Promise.resolve(),
  addTheCropRecommendation: () => Promise.resolve(),
  updateNitrogenBalanceAndRegenerateRotation: () => Promise.resolve(),
  updateDivisionSizeAndRedistribute: () => Promise.resolve(),
});

interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [cropRotation, setCropRotation] = useState([]);

  const generateCropRotation = async (
    fieldSize: number,
    numberOfDivisions: number,
    rotationName: string,
    crops: DataType,
    maxYears: number,
    ResidualNitrogenSupply:number,
  ) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL_cropRotation}`,
        { 
          fieldSize, 
          numberOfDivisions,
          rotationName,
          crops,
          maxYears,
          ResidualNitrogenSupply,
        },
        {
        }
      );
      if (response.status === 200) {
        setCropRotation(response.data);
      } else {
        setIsError(true);
        setMessage('Error generating crop rotation');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error generating crop rotation');
    }
    setIsLoading(false);
  };

  const getCropRotation = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL_cropRotation}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setCropRotation(response.data);
      } else if (response.status === 204) {
        setMessage('Nu exista nici o rotatie de culturi');
        setCropRotation(response.data);
      } else
       {
        setIsError(true);
        setMessage('Eroare la preluarea rotatiei de culturi');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Eroare la preluarea rotatiei de culturi');
    }
    setIsLoading(false);
  };

  const deleteCropRotation = async (id: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(`${API_URL_cropRotation}${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Crop rotation deleted successfully');
      } else {
        setIsError(true);
        setMessage('Error deleting crop rotation');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error deleting crop rotation');
    }
    setIsLoading(false);
  };




  const getCropRecommendations = useCallback(async (cropName: string, token: string) => {
    let recommendations = [];
    if (cropName !== '') {
      try {
        const response = await axios.get(
          `${API_URL_cropRecommendations}?cropName=${cropName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200 && response.data.length > 0) { // check if response data is not empty
          recommendations = response.data;
        }
      } catch (error) {
        console.error(error);
      }
    }
    return recommendations;
  }, []);
  


  
  const updateNitrogenBalanceAndRegenerateRotation = async ( token: string, data: any) => {
  setIsLoading(true);
  const {rotationName, year, division, nitrogenBalance } = data;
  try {
    const response = await axios.put(`${API_URL_cropRotation}`, {year, rotationName,division, nitrogenBalance }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Nitrogen Balance and Crop Rotation updated successfully');
      setCropRotation(response.data);
    } else {
      setIsError(true);
      setMessage('Error updating Nitrogen Balance and Crop Rotation');
    }
  } catch (err) {
    setIsError(true);
    setMessage('Error updating Nitrogen Balance and Crop Rotation');
  }
  setIsLoading(false);
};

  
const updateDivisionSizeAndRedistribute = async (token: string, data: any) => {
  const { rotationName, division, newDivisionSize } = data;
  setIsLoading(true);
  try {
    const response = await axios.put(`${API_URL_cropRotation}`, { rotationName, division, newDivisionSize }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Division Size and Crop Rotation updated successfully');
      setCropRotation(response.data);
    } else {
      setIsError(true);
      setMessage('Error updating Division Size and Crop Rotation');
    }
  } catch (err) {
    setIsError(true);
    setMessage('Error updating Division Size and Crop Rotation');
  }
  setIsLoading(false);
};




  

  return (
    <GlobalContext.Provider
      value={{
        isLoading,
        setIsLoading,
        isError,
        setIsError,
        isSuccess,
        setIsSuccess,
        message,
        setMessage,
        setCropRotation,
        generateCropRotation,
        getCropRotation,
        cropRotation,
        updateNitrogenBalanceAndRegenerateRotation,
        updateDivisionSizeAndRedistribute,
      

      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContextCrop = () => {
  return useContext(GlobalContext);
};
export const useGlobalContextCropRotation = () => {
  return useContext(GlobalContext);
};
```

# Context/UserStore.tsx

```tsx
"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

//const API_URL = 'http://localhost:3000/api/Controllers/User/';
const API_URL = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/User/';


type DataType = {
  _id: string;
  role: string;
  name: string;
  email: string;
  fermierUsers?: any[];
  picture?: string;
};

interface ContextProps {
  data: DataType;
  setData: (data: DataType) => void;
  error: string;
  loading: boolean;
  login: () => void;
  logout: () => void;
  // modify: (id: string, password: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchFermierUsers: () => Promise<void>;
  fermierUsers: any[];
  //bool
  isUserLoggedIn: () => boolean;
  register: (role: string, name: string, email: string) => Promise<void>;
  updateRole: (email: string, role: string) => Promise<void>;
}


const GlobalContext = createContext<ContextProps>({} as ContextProps);

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DataType>({ _id: '', role: "", name: '', email: '', fermierUsers: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fermierUsers, setFermierUsers] = useState<any[]>([]);
  const { user, error: authError, isLoading } = useUser();

  const router = useRouter();

  useEffect(() => {
    if (user && user.name && !authError && !isLoading) {
      setData({
        _id: user.sub,
        role: user.userRoles[0],
        name: user.name,
        email: user.email,
        fermierUsers: []
      });
    }
  }, [user, authError, isLoading]);

  useEffect(() => {
    const handleRequest = async () => {
      setLoading(true);
      try {
        if (!isLoading && user) {
          setData((prevData) => ({
            ...prevData,
            role: user.userRoles[0]
          }));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    handleRequest();
  }, [isLoading, user]);

  // Check if user is logged in
  const isUserLoggedIn = () => {
    if (user) {
      setData({
        _id: user.sub,
        role: user.userRoles[0],
        name: user.name,
        email: user.email,
        fermierUsers: []
      });
      return true;
    } else {
      return false;
    }
  };
  
 const register = async (role: string, name: string, email: string) => {
    setLoading(true);
    try {
      await axios.post(API_URL + 'register', {
      
        name,
        email,
        role
        
      }).then((response) => {
        setData(response.data);
        router.push('/');
      });
    } catch (error) {
      setError('Error registering user');
    } finally {
      setLoading(false);
    }
  }

  

const login = async () => {

    setData(undefined);
    router.push('/api/auth/login');
  }


  const logout = async () => {
    router.push('/api/auth/logout');
    setData(undefined);
  };


const deleteUser = async ( id: string) => {
setLoading(true);
try {
  await axios.delete(API_URL + "delete/" + id ).then(() => {
  setFermierUsers((prevFermierUsers) =>
  prevFermierUsers.filter((user) => user._id !== id)
  );
  }
  );
  } catch (error) {
  setError('Error deleting user');
  }
  finally {
  setLoading(false);
  }
  };

  const updateRole = async (email: string, role: string) => {
    setLoading(true);
    try {
      await axios.post(API_URL + 'changeRole', {
        email,
        role
      }).then((response) => {
        setData(response.data);
      });
    } catch (error) {
      setError('Error updating role');
    } finally {
      setLoading(false);
    }
  
  }




const fetchFermierUsers = async () => {
setLoading(true);
try {
  await axios.get(API_URL + 'fermieri',
  {

      }
      ).then((response) => {
      setFermierUsers(response.data);
      }
      );
      } catch (error) {
      setError('Error fetching users');
      } finally {
      setLoading(false);
      }
      };






return (
<GlobalContext.Provider
value={{
  data,
  login,
  setData,
  logout,
  error,
  loading,
  deleteUser,
  fetchFermierUsers,
  fermierUsers,
  isUserLoggedIn,
  register ,
  updateRole
 
}}
>
{children}
</GlobalContext.Provider>
);
};

export const useGlobalContext = () => {
return useContext(GlobalContext);

};
```

# Crud/CropForm.js

```js
"use client";
import { useGlobalContextCrop } from '../Context/culturaStore';
import { useGlobalContext } from '../Context/UserStore';
import FileBase from 'react-file-base64';
import CropRecommendations from './CropRecommandations';
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const CropForm = () => {
  const { createCrop } = useGlobalContextCrop();
  const { data } = useGlobalContext();

  const [cropName, setCropName] = useState(sessionStorage.getItem('cropName') || '');
  const [cropType, setCropType] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [harvestingDate, setHarvestingDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [soilType, setSoilType] = useState('');
  const [fertilizers, setFertilizers] = useState([]);
  const [pests, setPests] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [ItShouldNotBeRepeatedForXYears, setItShouldNotBeRepeatedForXYears] = useState('');
  const [climate, setClimate] = useState('');
  const [nitrogenSupply, setNitrogenSupply] = useState('');
  const [nitrogenDemand, setNitrogenDemand] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();

    const newCrop = {
      cropName,
      cropType,
      cropVariety,
      plantingDate,
      harvestingDate,
      description,
      imageUrl,
      soilType,
      climate,
      fertilizers,
      pests,
      diseases,
      ItShouldNotBeRepeatedForXYears: !isNaN(parseInt(ItShouldNotBeRepeatedForXYears))
        ? parseInt(ItShouldNotBeRepeatedForXYears)
        : null,
      nitrogenSupply: nitrogenSupply,
      nitrogenDemand: nitrogenDemand,
    };

    createCrop(newCrop);
  };

  const debouncedSetCropName = useCallback(
    debounce((value) => sessionStorage.setItem('cropName', value), 1000),
    []
  );

  useEffect(() => {
    if (cropName) {
      debouncedSetCropName(cropName);
    }
  }, [cropName, debouncedSetCropName]);


  const toggleAdditionalFields = () => setShowAdditional(!showAdditional);
  return (
    <div className="container">
      <section className="form my-5">
        <form onSubmit={onSubmit}>
          <div className="row">
            <div className="col-md-3 form-group">
              <label htmlFor="cropName">Crop Name:</label>
              <input
                type="text"
                name="cropName"
                id="cropName"
                value={cropName}
                onChange={(e) => {
                  setCropName(e.target.value);
                }}
                className="form-control"
                required
              />
            </div>
           
            <div className="col-md-3 form-group">
              <label htmlFor="cropVariety">Crop Variety:</label>
              <input
                type="text"
                name="cropVariety"
                id="cropVariety"
                value={cropVariety}
                onChange={(e) => setCropVariety(e.target.value)}
                className="form-control"
              />
            </div>
            
            <br />
            <strong>Rotation Requirements:</strong>
            <br />
            <div className="row">
              <div className="col-md-3 form-group">
                <label htmlFor="pests">Pests:</label>
                <select
                  name="pests"
                  id="pests"
                  multiple
                  value={pests}
                  onChange={(e) =>
                    setPests(Array.from(e.target.selectedOptions, (option) => option.value))
                  }
                  required
                  className="form-control"
                >
                  <option value="">Select a pest</option>
                  <option value="aphids">Aphids</option>
                  <option value="beetles">Beetles</option>
                  <option value="flies">Flies</option>
                  <option value="spiders">Spiders</option>
                </select>
              </div>
              <div className="col-md-3 form-group">
                <label htmlFor="diseases">Diseases:</label>
                <select
                  name="diseases"
                  id="diseases"
                  multiple
                  value={diseases}
                  onChange={(e) =>
                    setDiseases(Array.from(e.target.selectedOptions, (option) => option.value))
                  }
                  className="form-control"
                  required
                >
                  <option value="">Select a disease</option>
                  <option value="bee">Bee</option>
                  <option value="fusarium">Fusarium</option>
                  <option value="mildew">Mildew</option>
                  <option value="mold">Mold</option>
                  <option value="powderyMildew">Powdery Mildew</option>
                  <option value="pest">Pest</option>
                  <option value="rust">Rust</option>
                  <option value="disorder">Disorder</option>
                  <option value="virus">Virus</option>
                </select>
              </div>
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="nitrogenSupply">Nitrogen Supply:</label>
              <input
                type="number"
                name="nitrogenSupply"
                id="nitrogenSupply"
                value={nitrogenSupply}
                onChange={(e) => setNitrogenSupply(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="nitrogenDemand">Nitrogen Demand:</label>
              <input
                type="number"
                name="nitrogenDemand"
                id="nitrogenDemand"
                value={nitrogenDemand}
                onChange={(e) => setNitrogenDemand(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="ItShouldNotBeRepeatedForXYears">Do Not Repeat for X Years:</label>
              <input
                type="number"
                name="ItShouldNotBeRepeatedForXYears"
                id="ItShouldNotBeRepeatedForXYears"
                value={ItShouldNotBeRepeatedForXYears}
                onChange={(e) => setItShouldNotBeRepeatedForXYears(e.target.value)}
                className="form-control"
                required
              />
            </div>
          </div>
          <button type="button" onClick={toggleAdditionalFields} className="btn btn-block mt-2 mb-2">
            {showAdditional ? 'Hide Additional Fields' : 'Show Additional Fields'}
          </button>

          {showAdditional && (
            <>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="fertilizers">Used Fertilizers:</label>
                  <select
                    name="fertilizers"
                    id="fertilizers"
                    multiple
                    value={fertilizers}
                    onChange={(e) =>
                      setFertilizers(Array.from(e.target.selectedOptions, (option) => option.value))
                    }
                    className="form-control"
                  >
                    <option value="nitrogen">Nitrogen</option>
                    <option value="phosphorus">Phosphorus</option>
                    <option value="potassium">Potassium</option>
                    <option value="organic">Organic</option>
                  </select>
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="climate">Climate:</label>
                  <input
                    type="text"
                    name="climate"
                    id="climate"
                    value={climate}
                    onChange={(e) => setClimate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="cropType">Crop Type:</label>
                  <select
                    name="cropType"
                    id="cropType"
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a type</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="cereals">Cereals</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="soilType">Soil Type:</label>
                  <select
                    name="soilType"
                    id="soilType"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a soil type</option>
                    <option value="clay">Clay</option>
                    <option value="sandy">Sandy</option>
                    <option value="silty">Silty</option>
                    <option value="loamy">Loamy</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="plantingDate">Planting Date:</label>
                  <input
                    type="date"
                    name="plantingDate"
                    id="plantingDate"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="form-control"
                  />
                  <label htmlFor="harvestingDate">Harvesting Date:</label>
                  <input
                    type="date"
                    name="harvestingDate"
                    id="harvestingDate"
                    value={harvestingDate}
                    onChange={(e) => setHarvestingDate(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    name="description"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <h3 className="text-center mb-4">Add Image</h3>
                  <FileBase multiple={false} onDone={({ base64 }) => setImageUrl(base64)} />
                </div>
              </div>
            </>
          )}

          <div className="row">
            <div className="col-md-3 form-group">
              <h3 className="text-center mb-4">Add Image</h3>
              <FileBase multiple={false} onDone={({ base64 }) => setImageUrl(base64)} />
            </div>
          </div>
          <br />
          <div className="form-group">
            <button className="btn btn-primary btn-block" type="submit">
              Add Crop
            </button>
          </div>
        </form>
      </section>

      {cropName && (
        <>
          <h2 className="text-center mb-4">Similar Crops</h2>
          <CropRecommendations cropName={cropName}  />
        </>
      )}
    </div>
  );
}

export default CropForm;



```

# Crud/CropRecommandations.tsx

```tsx


"use client"
import React, { useEffect, useState } from 'react';
import { useGlobalContextCrop } from '../Context/culturaStore';

export default function CropRecommendations({ cropName, token }: { cropName: string, token: string }) {
  const { getCropRecommendations } = useGlobalContextCrop();
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    getCropRecommendations(cropName).then((recommendations) => {
      if (recommendations !== undefined) {
        setRecommendations(recommendations);
      }
    });
  }, [cropName, getCropRecommendations, token]);


  return (
    <div className="container">
      <div className="row">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="col-sm-6 col-md-4 col-lg-3">
            <div
              className="card border-primary mb-3"
              style={{ maxWidth: '18rem' }}
            >
              <div className="card-header">{recommendation.cropName}</div>
              <div className="card-body">
                <p className="card-text small">
                  <strong>Diseases:</strong>{' '}
                  {recommendation.diseases.join(', ')}
                </p>
                <p className="card-text small">
                  <strong>Pests:</strong> {recommendation.pests.join(', ')}
                </p>
                <p className="card-text small">
                  <strong>Nitrogen Supply:</strong>{' '}
                  {recommendation.nitrogenSupply}
                </p>
                <p className="card-text small">
                  <strong>Nitrogen Demand:</strong>{' '}
                  {recommendation.nitrogenDemand}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

# Crud/GetAllInRotatie/[SinglePag]/components/CropCardComponent.tsx

```tsx
import React from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { useSignals  } from "@preact/signals-react/runtime";



function CropCardComponent({ 
  crops, 
  handleDelete, 
  canEdit, 
  setEditMode 
}: {
  crops?: any, 
  handleDelete?: () => void, 
  canEdit?: boolean, 
  setEditMode?: (editMode: boolean) => void 
}) {
  useSignals();

  console.log('CropCardComponent.tsx rendered')

  if (!crops) {
    return <div>No crops data provided</div>;
  }
  
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Body>
        <Card.Title>{crops?.cropName}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{crops?.cropType}</Card.Subtitle>
        <Card.Text>{crops?.description}</Card.Text>
      </Card.Body>
      <ListGroup variant="flush">
        <ListGroup.Item>Crop Variety: {crops?.cropVariety}</ListGroup.Item>
        <ListGroup.Item>Diseases: {crops?.diseases.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Fertilizers: {crops?.fertilizers.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Pests: {crops?.pests.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Soil Type: {crops?.soilType}</ListGroup.Item>
        <ListGroup.Item>Nitrogen Demand: {crops?.nitrogenDemand}</ListGroup.Item>
        <ListGroup.Item>Nitrogen Supply: {crops?.nitrogenSupply}</ListGroup.Item>
        <ListGroup.Item>Planting Date: {crops?.plantingDate}</ListGroup.Item>
        <ListGroup.Item>Harvesting Date: {crops?.harvestingDate}</ListGroup.Item>
        <ListGroup.Item>Soil Residual Nitrogen: {crops?.soilResidualNitrogen}</ListGroup.Item>
      </ListGroup>
      {canEdit && (
        <Card.Body>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="primary" onClick={() => setEditMode(true)}>
            Edit
          </Button>
        </Card.Body>
      )}
    </Card>
  );
}

export default CropCardComponent;
```

# Crud/GetAllInRotatie/[SinglePag]/components/FormComponent.tsx

```tsx
import React from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';


function FormComponent({ handleUpdate, handleChange, handleArrayChange, updatedCrop, editMode, setEditMode }) {
  if (!editMode) {
    return null; 
  }
  return (
    <Form onSubmit={handleUpdate}>
      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Crop Name</Form.Label>
            <Form.Control
              type="text"
              name="cropName"
              value={updatedCrop?.cropName}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={updatedCrop?.description}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Crop Type</Form.Label>
            <Form.Control
              type="text"
              name="cropType"
              value={updatedCrop?.cropType}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Crop Variety</Form.Label>
            <Form.Control
              type="text"
              name="cropVariety"
              value={updatedCrop?.cropVariety}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col>
          {updatedCrop?.diseases?.map((disease, index) => (
            <Form.Group key={index}>
              <Form.Label>Disease {index + 1}</Form.Label>
              <Form.Control
                type="text"
                name={`disease${index}`}
                value={disease}
                onChange={(e) => handleArrayChange(e, index, 'diseases')}
              />
            </Form.Group>
          ))}

          {updatedCrop?.pests?.map((pest, index) => (
            <Form.Group key={index}>
              <Form.Label>Pest {index + 1}</Form.Label>
              <Form.Control
                type="text"
                name={`pest${index}`}
                value={pest}
                onChange={(e) => handleArrayChange(e, index, 'pests')}
              />
            </Form.Group>
          ))}
        </Col>
      </Row>

      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Soil Type</Form.Label>
            <Form.Control
              type="text"
              name="soilType"
              value={updatedCrop?.soilType}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Nitrogen Demand</Form.Label>
            <Form.Control
              type="number"
              name="nitrogenDemand"
              value={updatedCrop?.nitrogenDemand}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col>
          <Form.Group>
            <Form.Label>Nitrogen Supply</Form.Label>
            <Form.Control
              type="number"
              name="nitrogenSupply"
              value={updatedCrop?.nitrogenSupply}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Planting Date</Form.Label>
            <Form.Control
              type="date"
              name="plantingDate"
              value={updatedCrop?.plantingDate}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Harvesting Date</Form.Label>
            <Form.Control
              type="date"
              name="harvestingDate"
              value={updatedCrop?.harvestingDate}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Soil Residual Nitrogen</Form.Label>
            <Form.Control
              type="number"
              name="soilResidualNitrogen"
              value={updatedCrop?.soilResidualNitrogen}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <Button variant="primary" type="submit">
        Save Changes
      </Button>
      <Button variant="secondary" onClick={() => setEditMode(false)}>
        Cancel
      </Button>
    </Form>
  );
}

export default FormComponent;

```

# Crud/GetAllInRotatie/[SinglePag]/components/SelectAreaComponent.tsx

```tsx
import React from 'react';
import { Form, Button } from 'react-bootstrap';

function SelectAreaComponent({ onSubmit, selectarea, setSelectarea, numSelections, setNumSelections }) {
  return (
    <Form onSubmit={(e) => onSubmit(e, !selectarea)}>
      <Form.Group>
        <Form.Label>Number of selections</Form.Label>
        <Form.Control
          type="number"
          min="1"
          value={numSelections}
          onChange={(e) => setNumSelections(parseInt(e.target.value))}
        />
      </Form.Group>
      <Button variant="success" type="submit">
        {selectarea ? 'Deselect' : 'Select'}
      </Button>
    </Form>
  );
}

export default SelectAreaComponent;

```

# Crud/GetAllInRotatie/[SinglePag]/page.tsx

```tsx
"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Container, Button, Card, ListGroup } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useGlobalContext } from '../../../Context/UserStore';
import { useGlobalContextCrop } from '../../../Context/culturaStore';
import FormComponent from './components/FormComponent';
import CropCardComponent from './components/CropCardComponent';
import SelectAreaComponent from './components/SelectAreaComponent';
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';

function SinglePag() {
  useSignals();
  const { data: userData } = useGlobalContext();
  const { user, error, isLoading: isUserLoading } = useUser();

  const {
    singleCrop,
    isLoading,
    isError,
    message,
    selectare,
    SinglePage,
    deleteCrop,
    updateCrop,
  } = useGlobalContextCrop();

  const navigate = useRouter();
  const _id = useSearchParams().get('crop');
  const crops = singleCrop.value;

  const [selectarea, setSelectarea] = useState(false);
  const [numSelections, setNumSelections] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [updatedCrop, setUpdatedCrop] = useState(() => ({
    cropName: crops?.cropName,
    ItShouldNotBeRepeatedForXYears: crops?.ItShouldNotBeRepeatedForXYears,
    description: crops?.description,
    cropType: crops?.cropType,
    cropVariety: crops?.cropVariety,
    diseases: crops?.diseases,
    fertilizers: crops?.fertilizers,
    pests: crops?.pests,
    soilType: crops?.soilType,
    nitrogenDemand: crops?.nitrogenDemand,
    nitrogenSupply: crops?.nitrogenSupply,
    plantingDate: crops?.plantingDate,
    harvestingDate: crops?.harvestingDate,
    soilResidualNitrogen: crops?.soilResidualNitrogen,
  }));
  


  const canEdit = userData.role.toLocaleLowerCase() === 'admin' ||  crops?.user == userData._id;
  const editPressed = () => {
    setEditMode(true);
  }
  

    useEffect(() => {
      if (!isUserLoading) {
       
        SinglePage(_id);
       console.log('SinglePage call');
      }
    }, [isUserLoading]);

    if (isError.message) {
      console.log("Eroare  " + message);
    }
    useEffect(() => {
      setUpdatedCrop({
        cropName: crops?.cropName,
        ItShouldNotBeRepeatedForXYears: crops?.ItShouldNotBeRepeatedForXYears,
        description: crops?.description,
        cropType: crops?.cropType,
        cropVariety: crops?.cropVariety,
        diseases: crops?.diseases,
        fertilizers: crops?.fertilizers,
        pests: crops?.pests,
        soilType: crops?.soilType,
        nitrogenDemand: crops?.nitrogenDemand,
        nitrogenSupply: crops?.nitrogenSupply,
        plantingDate: crops?.plantingDate,
        harvestingDate: crops?.harvestingDate,
        soilResidualNitrogen: crops?.soilResidualNitrogen,
      });
    }, [crops]); // Only re-run the effect if crops changes
    
  
console.log('crops', crops);

 // Don't render the components until the necessary data is available
 if (isLoading.value || !crops) {
  return (
    <div>
      <p>Loading crop ...</p>
    </div>
  );
}

  // if (isError) {
  //   return <h1>{message}</h1>;
  // }

  const handleDelete = async () => {
    try {
      await deleteCrop(_id);
      console.log('Crop deleted');
      navigate.push('/pages/Rotatie');
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateCrop(_id, updatedCrop);
    setEditMode(false);
    
  };

  const handleChange = (e) => {
    
    const { name, value } = e.target;
    setUpdatedCrop({ ...updatedCrop, [name]: value });
  };

  const handleArrayChange = (e, index, field) => {
    const newArr = [...updatedCrop[field]];
    newArr[index] = e.target.value;
    setUpdatedCrop({ ...updatedCrop, [field]: newArr });
  };

  const onSubmit = async (e, newSelectArea) => {
    e.preventDefault();
    if (userData && userData.role.toLowerCase() === "farmer") {
      await selectare(_id, newSelectArea, numSelections);
      setSelectarea(newSelectArea);
    }
  };
  console.log(updatedCrop)

  return (
    <div>
       <CropCardComponent 
  crops={crops} 
  handleDelete={handleDelete} 
  canEdit={canEdit} 
  setEditMode={setEditMode} 
/>
      <FormComponent 
        handleUpdate={handleUpdate} 
        handleChange={handleChange} 
        handleArrayChange={handleArrayChange} 
        updatedCrop={updatedCrop} 
        editMode={editMode} 
        setEditMode={setEditMode} 
      />

      <SelectAreaComponent 
        onSubmit={onSubmit} 
        selectarea={selectarea} 
        setSelectarea={setSelectarea} 
        numSelections={numSelections} 
        setNumSelections={setNumSelections} 
      />
    </div>
  );
}


export default SinglePag;






```

# Crud/GetAllInRotatie/page.tsx

```tsx
import Link from 'next/link';

export default function Continut({ crop }: { crop: any }): JSX.Element {
  return (
    <>
      <div className="thumbnail">
        {/* <Image src={"data:image/jpeg;" + crop.image.substring(2, crop.image.length - 2)} width={500} height={500} className="rounded img-fluid img" alt="Paris" /> */}
        <p>
          <strong>{crop.cropName}</strong>
          <br />
          <strong>{crop.cropType}</strong>
        </p>
        <p>{crop.description} </p>
        <p>Soil type: {crop.soilType}</p>
        <p>Should not be repeated for {crop.ItShouldNotBeRepeatedForXYears} years</p>
      </div>

      <Link href={`/Crud/GetAllInRotatie/SinglePag?crop=${crop._id}`}>
        <button type="button" className="btn btn-primary">
          See more
        </button>
      </Link>
    </>
  );
}


```

# Crud/GetAllPosts/[SinglePost]/page.tsx

```tsx
"use client"
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Button, Form } from 'react-bootstrap';
import { useGlobalContextPost } from '../../../Context/postStore';
import { useGlobalContext } from '../../../Context/UserStore';


// interface SinglePostProps {
//   postId: string;
// }

export default function SinglePost() {
  const postId = useSearchParams().get("post") as string;
  const { data: allData, loading, getPost, deletePost, updatePost } = useGlobalContextPost();
  const data = allData?.posts;
  const { data: user } = useGlobalContext();
  const isAdmin = user?.role.toLowerCase() === 'admin';
  const [editMode, setEditMode] = useState(false);
  const [updatedPost, setUpdatedPost] = useState({
    title: '',
    brief: '',
    description: '',
  });

  useEffect(() => {
    getPost(postId);
  }, [ postId]);

  useEffect(() => {
    if (data) {
      setUpdatedPost({
        title: data.title,
        brief: data.brief,
        description: data.description,
      });
    }
  }, [data]);

  const handleDelete = async () => {
    await deletePost(data?._id);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updatePost(data?._id, {
      title: updatedPost.title,
      brief: updatedPost.brief,
      description: updatedPost.description,
    });
    setEditMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdatedPost({ ...updatedPost, [name]: value });
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!data) {
    return <h1>Nothing to show</h1>;
  }

  return (
    <Container>
      {editMode ? (
        <Form onSubmit={handleUpdate}>
          <Form.Group>
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={updatedPost.title}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Brief</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="brief"
              value={updatedPost.brief}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="description"
              value={updatedPost.description}
              onChange={handleChange}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>
          <Button variant="secondary" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
        </Form>
      ) : (
        <>
          <h1>{data.title}</h1>
          <p>{data.brief}</p>
          <p>{data.description}</p>
          {isAdmin && (
            <>
              <Button variant="danger" onClick={handleDelete}>
                Delete Post
              </Button>
              <Button variant="primary" onClick={() => setEditMode(true)}>
                Edit Post
              </Button>
            </>
          )}
        </>
      )}
    </Container>
  );
};

 




```

# Crud/GetAllPosts/page.tsx

```tsx
import Link from 'next/link';

function Continut({ data }: { data: any }): JSX.Element {
    return (
        <div className="h-screen flex flex-col">
            <div className="flex-grow">
                <h1>{data.title}</h1>
                {data.brief.length > 400 ? (
                    <p>{data.brief.slice(0, 400)}...</p>
                ) : (
                    <p>{data.brief}</p>
                )}
            </div>
            <div className="mt-auto">
                <Link href={`/Crud/GetAllPosts/SinglePost?post=${data._id}`}>
                    <button type="button" className="btn btn-primary">See article</button>
                </Link>
            </div>
        </div>
    );
}

export default Continut;


```

# Crud/Header.tsx

```tsx
"use client"
import { Dropdown } from 'react-bootstrap';
import { useGlobalContext } from '../Context/UserStore';
import styles from '../../styles/Header.module.css';
import Link from 'next/link';

function HeaderLog() {
  const { data , login , logout} = useGlobalContext();

  return (
    <header className={`${styles.headerModule} py-2`}>
      {data && data.name ? (
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" id="dropdownMenuButton1">
            <Link href="/pages/Login/Dashboard/" style={{ textDecoration: 'none', color: '#fff' }}>
            {data.picture && (
  <img 
    src={data.picture} 
    alt="User Avatar" 
    width="40" 
    height="40" 
    style={{ borderRadius: "25%", marginRight: "10px" }} 
  />
)}
              {data.name}
            </Link>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} href="/pages/Rotatie">Crop library</Dropdown.Item>
            <Dropdown.Item as={Link} href="/pages/Login/Dashboard/">Dashboard</Dropdown.Item>
            {data.role.toLowerCase() === 'farmer' && (
              <>
                <Dropdown.Item as={Link} href="/pages/Login/RotatieDashboard/">Crop rotation</Dropdown.Item>
                {/* <Dropdown.Item as={Link} href="/pages/Recomandari/">Analitics</Dropdown.Item> */}
              </>
            )}
            <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <div>
          <div onClick={login} tabIndex={0}>Log in</div>
        </div>
      )}
    </header>
  );
}

export default HeaderLog;
```

# Crud/PostForm.tsx

```tsx
"use client"

import { useState } from 'react'
import FileBase from 'react-file-base64';
import { useGlobalContextPost } from '../Context/postStore';
import { useGlobalContext } from '../Context/UserStore';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

function PostForm() {
    const [title, setTitle] = useState('');
    const [brief, setBrief] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const { createPost } = useGlobalContextPost();
    const { data } = useGlobalContext();

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title || !brief || !description) {
            alert('Ceva lipseste');
            return;
        }
        createPost({ title, brief, description, image, id: '', _id: '', user: '', token: '' }, data.token);
        setTitle('');
        setBrief('');
        setDescription('');
        setImage('');
    };

    return (
        <section className='form'>
            <Form onSubmit={onSubmit}>
                <Form.Group>
                    <Form.Label htmlFor='title'>Titlu:</Form.Label>
                    <Form.Control
                        type='title'
                        name='title'
                        id='title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Form.Label htmlFor='text'>Descriere pe scurt:</Form.Label>
                    <Form.Control
                        type='text'
                        name='text'
                        id='text'
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                    />
                    <Form.Label htmlFor='description'>Continut:</Form.Label>
                    <Form.Control
                        type='description'
                        name='description'
                        id='description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Form.Label htmlFor='image'>Imagine:</Form.Label>
                    <FileBase
                        multiple={false}
                        onDone={({ base64 }: { base64: string }) => setImage(base64)}
                    />
                    <Button type='submit' variant='primary' className='btn-block'>
                        Adauga
                    </Button>
                </Form.Group>
            </Form>
        </section>
    );
}

export default PostForm;
```

# Crud/PostItem.tsx

```tsx
type postType = {
    _id: string
    title: string
    text: string
    createdAt: string
    }

export default function PostItem(  { post }: { post: postType }  ) {
    
    return (
        <div className='post'>
            <h3>{post.title}</h3>
            <p>{post.text}</p>
            <div>{new Date(post.createdAt).toLocaleString('en-US')}</div>
        </div>
    );
}

```

# Crud/Rotatie.module.css

```css
.cropList {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    margin: -15px;
  }
  
  .crop {
    flex: 1 0 20%; /* change as needed, 20% will fit 5 in a row */
    margin: 15px;
    padding: 20px;
 
    border-radius: 10px;
    background-color: #f9f9f9;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .cropName {
    margin: 0;
    margin-bottom: 10px;
    color: #333;
  }
  
  .cropDetails {
    display: flex;
    justify-content: space-between;
  }
  
  .cropDates {
    margin-top: 10px;
  }
  
  .cropImage {
    width: 100%;
    height: auto;
    object-fit: cover;
    margin-top: 10px;
  }
  
  .additionalInfo {
    margin-top: 10px;
  }
  

  .crop {
    border: 1px solid #ddd;
    padding: 8px;
    margin-bottom: 8px;
    border-radius: 5px;
    background-color: #f9f9f9;
  }
  
  .cropName {
    font-size: 1.2em;
    margin-bottom: 4px;
  }
  
  .cropDetails, .cropDates, .additionalInfo, .creationDate {
    margin-bottom: 8px;
  }
  
  .cropImage {
    max-width: 100%;
    height: auto;
    margin-bottom: 8px;
  }
  
  .seeMoreButton {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 3px;
  }
  
  .seeMoreButton:hover {
    background-color: #0056b3;
  }
  
  .listContainer ul {
    padding-left: 20px;
  }
  
  .creationDate p {
    margin: 0;
  }
  
```

# Crud/RotatieItem.tsx

```tsx
"use client";
import { useGlobalContextCrop } from '../Context/culturaStore';
import styles from './Rotatie.module.css';
import { Button } from 'react-bootstrap'; 
import React, { useEffect, useState } from 'react';

function RotatieItem({ crops, userID }) {
  const { deleteCrop, message } = useGlobalContextCrop();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 8;

  // Filter crops based on search term
  const filteredCrops = crops.value.filter(crop => {
    const regex = new RegExp(searchTerm, 'i');
    return regex.test(crop.cropName) || regex.test(crop.cropType) || regex.test(crop.cropVariety);
  });

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCrops.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <input
        type="text"
        placeholder="Search crops..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      <div className={styles.cropList}>
        {currentItems.map((crop) => (
          <CropItem key={crop._id} crop={crop} deleteCrop={deleteCrop} />
        ))}
      </div>
      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={filteredCrops.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
}

function Pagination({ itemsPerPage, totalItems, paginate, currentPage }) {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  if (pageNumbers.length <= 1) {
    return null;
  }

  return (
    <nav>
      <ul className='pagination'>
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <a onClick={() => paginate(number)} className='page-link'>
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CropItem({ crop, deleteCrop }) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className={styles.crop}>
      <h2 className={styles.cropName}>{crop.cropName}</h2>
      <div className={styles.cropDetails}>
        <h3>{crop.cropType}</h3>
        <h3>{crop.cropVariety}</h3>
      </div>
      <div className={styles.cropDates}>
        <div>Planting date: {crop.plantingDate}</div>
        <div>Harvesting date: {crop.harvestingDate}</div>
      </div>
      <p>{crop.description}</p>
      {crop.imageUrl && (
        <img
          src={'data:image/jpeg;' + crop.imageUrl.substring(2, crop.imageUrl.length - 2)}
          alt={crop.cropName}
          className={styles.cropImage}
        />
      )}
      {showMore && (
        <div className={styles.additionalInfo}>
          <div>Soil type: {crop.soilType}</div>
          <div>Climate: {crop.climate}</div>
          <div>It should not be repeated for {crop.ItShouldNotBeRepeatedForXYears} years</div>
          <div className={styles.listContainer}>
            <p>Fertilizers:</p>
            <ul>
              {crop.fertilizers.map((fertilizer, index) => (
                <li key={index}>{fertilizer}</li>
              ))}
            </ul>
            <p>Pests:</p>
            <ul>
              {crop.pests.map((pest, index) => (
                <li key={index}>{pest}</li>
              ))}
            </ul>
            <p>Diseases:</p>
            <ul>
              {crop.diseases.map((disease, index) => (
                <li key={index}>{disease}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <button onClick={() => setShowMore(!showMore)} className={`${styles.seeMoreButton} btn btn-block mt-2 mb-2`}>
        {showMore ? 'See Less..' : 'See More..'}
      </button>
      <div className={styles.creationDate}>
        <p>Adaugat la:</p>
        <div>{new Date(crop.createdAt).toLocaleString('en-US')}</div>
      </div>
      <Button variant="danger" size="sm" onClick={() => deleteCrop(crop._id)}>
        Delete Crop
      </Button>
    </div>
  );
}

export default RotatieItem;



```

# Crud/Spinner.tsx

```tsx
function Spinner() {
    return (
      <div className='loadingSpinnerContainer'>
        <div className='loadingSpinner'></div>
      </div>
    )
  }
  
  export default Spinner
```

# db.js

```js

const mongoose = require('mongoose')

export async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log('Connected ' + conn.connection.host)
   
    } catch (error){
        console.log(error);
        process.exit(1);
    }
}



```

# footer.tsx

```tsx
import Link from "next/link";
import styles from '../styles/Header.module.css';

export default function Footer() {
  return (
    <div className={styles.footerContainer}>
      <footer id="footer" className={styles.footer}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <p className="text-white text-center flex-grow-1 m-0">©{new Date().getFullYear()} Agricultural Platform. All rights reserved.</p>
            <div>
              <Link href="/pages/AboutUs" className={styles.navLink}>About Us</Link>
              <Link href="/pages/contact" className={styles.navLink}>Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

```

# head.tsx

```tsx

export default function Head() {
  return (
    <>
      <title></title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />

      <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
      <link rel="icon" href="/favicon.ico" />
    </>
  )
}

```

# header.tsx

```tsx
"use client"
import Link from 'next/link';
import HeaderLog from './Crud/Header';
import Image from 'next/image';
import styles from '../styles/Header.module.css';
import logo from '../public/Logo.png'
import { LanguageSwitch } from './Componente/LanguageSwitch';







function Header() {

 

  return (
    <div className={styles.container}>
 
      <header id="header" className={styles.header}>
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <div className={` d-flex align-items-center ${styles.link, styles.logo}`}>
            <Link href="/">
              <Image src="/Logo.png" width={95} height={95} alt="Platforma agricola logo" />
              <span className="ms-2 text-white">FutureName</span>
            </Link>
          </div>

          <nav id="navbar" className={styles.navbar}>
            <ul className="d-flex align-items-center justify-content-end mb-0">
              <li className="nav-item nav-list">
                <Link href="/" className={styles.navLink}>Home</Link>
              </li>
              <li className="nav-item nav-list">
                <Link href="/pages/News" className={styles.navLink}>News</Link>
              </li>
           


              <li className={`${styles.navLink} nav-item nav-list`}>
                <HeaderLog />
          
              
              </li>
              <div>
  {/* lang switch */}
  <LanguageSwitch />
</div>


            </ul>
          </nav>
          <i className="bi bi-list mobile-nav-toggle"></i>
        </div>
      </header>
      <hr />
    </div>
  );
}

export default Header;

```

# layout.tsx

```tsx
import React from 'react'
import Header from './header'
import Footer from './footer'

import 'bootstrap/dist/css/bootstrap.css'
import {GlobalContextProvider} from './Context/UserStore'
import {GlobalContextProvider as CulturaStore} from './Context/culturaStore'
import {GlobalContextProvider as PostStore } from './Context/postStore'
import '../styles/globalsBot.css';
// import Auth0ProviderWithHistory from './Auth0ProviderWrapper';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const locale = await getLocale();
 
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();


  return (
    <html lang={locale}>
      <head />
      <body className="bg-light">
        <div className="d-flex flex-column align-items-center" style={{minHeight:'98vh'}}>
        
          <div className=" w-100">
           
 <UserProvider>
            <PostStore>
              <CulturaStore>
                <GlobalContextProvider>
                  <Header />
                  <div className="container bg-white shadow-sm p-3 mb-5 rounded" style={{ maxWidth: '1400px' }}>
                  <NextIntlClientProvider messages={messages}>
                    {children}
                    </NextIntlClientProvider>
                  </div>
                </GlobalContextProvider>
              </CulturaStore>
            </PostStore>
            </UserProvider>
          
          </div>
          </div>
      
      <Footer />
      </body>
    </html>
  )
}
```

# not-found.js

```js
//not-found.js
import Link from 'next/link'

 
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}
```

# page.tsx

```tsx
"use client";
import Image from 'next/image'
import Link from 'next/link'
import classNames from 'classnames';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Noutati from './pages/News/News';
import {useTranslations} from 'next-intl';


export default function Home() {

  const titleClasses = classNames('h1', 'font-weight-bold', 'mb-4','align-items-center', 'justify-content-center');
  const t = useTranslations('HomePage');


  return (
    <Container >

      <h2 className={titleClasses}>
      {t('title')}
        Welcome to the main page of the agricultural platform!
      </h2>
      <div className="d-flex justify-content-center">
        {/* no border */}
        <Card className='noBorders' style={{
          border: 'none'
        }} >
          <Card.Body>
            <Card.Text  className='textFormating'>
               By using this platform, you will be able to easily plan an efficient crop rotation,
              which will help maintain healthy soil and achieve better yields. In addition, you will
              receive personalized recommendations for each crop, based on local conditions, soil history,
              and your preferences.

                To use this platform, you will need to create an account and provide information about your
              agricultural land, including soil type, climatic zone, previous crops, and other relevant details.
              Then, the platform will use APIs to obtain updated information about weather, soil, and other factors
              that may affect production.

                Based on this information, the platform will generate a personalized crop rotation plan, taking into
              account the requirements of each crop, soil type, and other relevant factors. You will also receive
              recommendations for soil preparation, plant nutrition, and pest and disease control.

                Our platform uses the latest technologies and updated data to provide you with the best recommendations
              and to help you achieve the best results on your farm. If you have any questions or issues, feel free
              to contact us through the platform.
            </Card.Text>
 
          </Card.Body>
        </Card>
      </div>
      <Noutati />


      
    </Container>
  );
}

```

# pages/AboutUs/page.tsx

```tsx
// import Mail from "../../Componente/Mail";
import Link from "next/link";
import { useTranslations } from 'next-intl';



export default function AboutUs() {
  const t = useTranslations('AboutUs');
  return (
    <div>
      <div id="background" className="jumbotron text-center" style={{ borderBottom: '1px darkgray dotted' }}>
        <h1>{t('title')}</h1>
        <h2>{t('subtitle')}</h2>
      </div>
      <div className="container text-center border-colorat" style={{ marginBottom: '8rem' }}>
        <h2>{t('vision')}</h2>
        <br />
        <div className="row">
          <div className="col-sm-4">
            <h4>{t('cropManagement')}</h4>
            <p>{t('cropManagementDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('supportCollaboration')}</h4>
            <p>{t('supportCollaborationDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('comprehensiveTracking')}</h4>
            <p>{t('comprehensiveTrackingDescription')}</p>
          </div>
        </div>
        <br /><br />
        <div className="row">
          <div className="col-sm-4">
            <h4>{t('robustAnalytics')}</h4>
            <p>{t('robustAnalyticsDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('efficiencyProfitability')}</h4>
            <p>{t('efficiencyProfitabilityDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('contactUs')}</h4>
            <li className="nav-item nav-list">
              <Link href="/pages/contact" className="nav-link">
                {t('contactUsForm')}
              </Link>
            </li>
          </div>
        </div>
      </div>
    </div>
  );
}





```

# pages/contact/Components/SendEmail.tsx

```tsx
import emailjs from '@emailjs/browser';

export default function sendEmail(form: React.MutableRefObject<HTMLFormElement>) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs
      .sendForm('service_ynv83op', 'template_3oljtxo', form.current, '92Cb78cmp5MUyYktO')
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );
  };
}

```

# pages/contact/Components/UserState.tsx

```tsx
import { useEffect, useState } from 'react';
import { useGlobalContext } from '../../../Context/UserStore';

export default function useUserState() {
  const { data } = useGlobalContext();
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (data) {
      setUser(data.name);
      setEmail(data.email);
    }
  }, [data]);

  return { user, setUser, email, setEmail };
}

```

# pages/contact/page.tsx

```tsx
import React, { useRef } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import useUserState from './Components/UserState';
import sendEmail from './Components/SendEmail';
import { useTranslations } from 'next-intl';

export default function Contact(): JSX.Element {
  const { user, setUser, email, setEmail } = useUserState();
  const form = useRef() as React.MutableRefObject<HTMLFormElement>;

  const t = useTranslations('Contact');

  return (
    <Container className="text-center mt-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Form ref={form} onSubmit={sendEmail(form)}>
            <Form.Group controlId="formBasicName">
              <Form.Label><strong>{t('Name')}</strong></Form.Label>
              <Form.Control type="text" name="user_name" value={user} onChange={(e) => setUser(e.target.value)} placeholder={t('Enter your name')} />
            </Form.Group>
            <Form.Group controlId="formBasicEmail">
              <Form.Label><strong>{t('Email')}</strong></Form.Label>
              <Form.Control type="email" name="user_email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Enter your email')} />
              <Form.Text className="text-muted">
                {t("We'll never share your email with anyone else.")}
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="formBasicMessage">
              <Form.Label><strong>{t('Message')}</strong></Form.Label>
              <Form.Control as="textarea" rows={4} name="message" placeholder={t('Enter your message')} />
            </Form.Group>
          
              <Button variant="primary" type="submit" className='mt-3'>{t('Send')}</Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}




```

# pages/DatabasePopulation/page.js

```js
'use client'
import React, { useEffect } from 'react';
import axios from 'axios';

const postData = [
    {
        "title": "Porumbul și Necesitățile sale de Azot",
        "brief": "Aflați mai multe despre necesitățile de azot ale porumbului.",
        "description": "Porumbul necesită un aport de azot de aproximativ 200 de unități. Acesta este un articol detaliat despre cum să gestionați corect necesitățile de azot ale porumbului pentru a obține un randament maxim.",
    },
];

const PostComponent = () => {
    useEffect(() => {
        postData.forEach((post) => {
            axios({
                method: 'GET',
                url: 'https://graph.microsoft.com/v1.0/sites/automatify.sharepoint.com:/sites/Engineering:/Florin_Sandbox/lists/TestsList/items',
                data: post,
                auth: {
                    type: 'ActiveDirectoryOAuth',
                    authority: 'https://login.microsoftonline.com/be9800e0-a8c9-4527-8797-6d6a00eb3029',
                    tenant: 'be9800e0-a8c9-4527-8797-6d6a00eb3029',
                    audience: 'https://automatify.sharepoint.com/sites/Engineering/Florin_Sandbox',
                    clientId: 'df33ad36-01e5-45ca-a990-b60d4aa5e40e',
                    secret: 'sxi8Q~NmEK-DBv1EQcgrtr-XEFjpGT2yn6udbavP'
                }
            })
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });
        });
    }, []);

    return (
        <div>
            {/* Your component JSX */}
        </div>
    );
};

export default PostComponent;





```

# pages/Login/Dashboard/AdminCropForm.tsx

```tsx
import React, { useState } from 'react';

interface FormData {
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
}

function AdminCropForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [cropName, setCropName] = useState('');
  const [nitrogenSupply, setNitrogenSupply] = useState('');
  const [nitrogenDemand, setNitrogenDemand] = useState('');
  const [pests, setPests] = useState('');
  const [diseases, setDiseases] = useState('');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      cropName,
      nitrogenSupply: Number(nitrogenSupply),
      nitrogenDemand: Number(nitrogenDemand),
      pests: pests.split(',').map((pest) => pest.trim()),
      diseases: diseases.split(',').map((disease) => disease.trim()),
    });
    setCropName('');
    setNitrogenSupply('');
    setNitrogenDemand('');
    setPests('');
    setDiseases('');
  };

  return (
    
    <form onSubmit={handleSubmit} className="p-3">
      <div className='form-group'>
      <h3>Adauga recomandare</h3>
        <label htmlFor='cropName'>Nume cultura:</label>
        <input
          id='cropName'
          type='text'
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='nitrogenSupply'>Aprovizionare azot:</label>
        <input
          id='nitrogenSupply'
          type='number'
          value={nitrogenSupply}
          onChange={(e) => setNitrogenSupply(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='nitrogenDemand'>Nevoie azot:</label>
        <input
          id='nitrogenDemand'
          type='number'
          value={nitrogenDemand}
          onChange={(e) => setNitrogenDemand(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='pests'>Daunatori (separat prin virgula):</label>
        <input
          id='pests'
          type='text'
          value={pests}
          onChange={(e) => setPests(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='diseases'>Boli (separat prin virgula):</label>
        <input
          id='diseases'
          type='text'
          value={diseases}
          onChange={(e) => setDiseases(e.target.value)}
          className='form-control'
        />
      </div>
      <button type='submit' className='btn btn-primary mt-2'>Trimite</button>
    </form>
  );
}

export default AdminCropForm;
```

# pages/Login/Dashboard/page.tsx

```tsx
"use client"
import React, { useEffect } from 'react';
import { Card, Container } from 'react-bootstrap';
import { FaUser } from 'react-icons/fa';
import Link from 'next/link';
import CropForm from '../../../Crud/CropForm';
import RotatieItem from '../../../Crud/RotatieItem';
import Spinner from '../../../Crud/Spinner';
import UserListItem from './UserListItem';
import LinkAdaugaPostare from '../Elements/LinkAdaugaPostare';
import { useGlobalContext } from '../../../Context/UserStore';
import { useGlobalContextCrop } from '../../../Context/culturaStore';
import { UserInfos } from './userInfos';
import AdminCropForm from './AdminCropForm';
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Dashboard() {
  const {
    crops,
    isLoading,
    getCrops,
    addTheCropRecommendation,
  } = useGlobalContextCrop();
  const {
    fetchFermierUsers,
    deleteUser,
    data,
    fermierUsers,
  } = useGlobalContext();
  const {  isLoading: isUserLoading } = useUser();

  useSignals();

  let apiCalls = ( ) => {
    getCrops();
    if (data?.role?.toLowerCase() === 'admin') {
      fetchFermierUsers();
    } 
  }

  useEffect(() => {
    if (!isUserLoading) {
      apiCalls();
    }
  }, [isUserLoading]);


  if (isLoading?.value) {
    return <Spinner />;
  }

  const handleAddCropRecommendation = async (cropData) => {
    await addTheCropRecommendation(cropData);
  };

  if (isUserLoading) return <div>Loading user...</div>;
  return (
    
    <>
   
      <UserInfos />
      {data && data?.role?.toLowerCase() === 'admin' ? (
        <Container>
          <Card>
            <section className="heading">
              <LinkAdaugaPostare />
              <br />
              <br />
              <Link href="/pages/Login/Register">
                <FaUser /> Add users
              </Link>
              <br />
              <br />
              <Container>
                <AdminCropForm onSubmit={handleAddCropRecommendation} />
              </Container>
              <p>Gestioneaza utilizatorii</p>
              <h2>Fermieri:</h2>
              <ul>
                {fermierUsers &&
                  fermierUsers.map((user) => (
                    <UserListItem
                      key={user._id}
                      user={user}
                      deleteUser={deleteUser}
                    />
                  ))}
              </ul>
            </section>
          </Card>
        </Container>
      ) : data && data?.role?.toLowerCase() === 'farmer' ? (
        <Container>
          <Card>
            <section className="heading">
              <p>Add crops:</p>
            </section>
            <CropForm />
            <section className="content">
              {crops?.value?.length > 0 ? (
                <div className="crops">
                  <RotatieItem crops={crops} userID={data._id} />
                </div>
              ) : (
                <h3>No crops were added</h3>
              )}
            </section>
          </Card>
        </Container>
      ) : (
        <h1>access denied</h1>
      )}
    </>
  );
}


```

# pages/Login/Dashboard/UpdateRoleForm.tsx

```tsx
import { useState } from 'react';
import { useGlobalContext } from '../../../Context/UserStore';
import { Form, Button } from 'react-bootstrap';

function UpdateRoleForm({ userMail }) {
  const [newRole, setNewRole] = useState('');  // Initialize newRole state
  const { updateRole } = useGlobalContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRole(userMail, newRole);  // Call updateRole with newRole
      alert('Role updated successfully');  // Update success message
    } catch (error) {
      console.error('Error updating role:', error);  // Update error message
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Select Role</Form.Label>
        <Form.Control
          as="select"
          value={newRole}  // Update selected value
          onChange={(e) => setNewRole(e.target.value)}  // Update onChange handler
          required
        >
          <option value="">Choose...</option>
          <option value="farmer">Farmer</option>
          <option value="admin">Admin</option>
        </Form.Control>
      </Form.Group>
      <Button type="submit">Update Role</Button>
    </Form>
  );
}

export default UpdateRoleForm;

```

# pages/Login/Dashboard/userInfos.tsx

```tsx
import React from 'react';
import { Card, Container } from 'react-bootstrap';
import { useGlobalContext } from '../../../Context/UserStore';
import LinkParola from '../Elements/page';

export const UserInfos = () => {
  const { data: { name, email, role } , isUserLoggedIn  } = useGlobalContext();

  const cardStyle = {
    backgroundColor: '#f2f2f2',
    padding: '20px',
    marginBottom: '20px',
  };

  const greetingStyle = {
    color: '#333',
    fontSize: '24px',
    marginBottom: '10px',
  };

  const infoStyle = {
    color: '#555',
    fontSize: '18px',
    marginBottom: '5px',
  };

  return (
    isUserLoggedIn ?
    <Container>
      <Card style={cardStyle}>
        <section className="heading">
          <h1 style={greetingStyle}>YO {name ? name : ''}</h1>
          {/* <LinkParola /> */}
          <h3 style={infoStyle}>Email: {email}</h3>
          <h3 style={infoStyle}>Nume utilizator: {name ? name : ''}</h3>
          <h3 style={infoStyle}>Permisiuni: {role}</h3>
        </section>
      </Card>
    </Container>
    : null
  );
};

```

# pages/Login/Dashboard/UserListItem.tsx

```tsx
import { useState } from 'react';
import UpdateRole from './UpdateRoleForm';

const UserListItem = ({ user, deleteUser } : { user: any, deleteUser: any }) => {
  const [showUpdateRole, setUpdateRole] = useState(false);

  return (
    <li key={user._id}>
      {user.name} - {user.email}{' '}
      <button onClick={() => deleteUser(user._id)}>Delete</button>
      <button onClick={() => setUpdateRole(!showUpdateRole)}>
        Update Role
      </button>
      {/* Show the UpdatePasswordForm component based on the state */}
      {showUpdateRole && <UpdateRole userMail={user.email} />}
    </li>
  );
};

export default UserListItem;
```

# pages/Login/DeprecatedLogin/page.tsx

```tsx
"use client";
import { useEffect, useState } from 'react';
import { FaSignInAlt, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGlobalContext } from '../../../Context/UserStore';
import Spinner from '../../../Crud/Spinner';
import Link from 'next/link';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;



  const { data, setData, error, loading, login } = useGlobalContext();

  const navigate = useRouter();

  useEffect(() => {
    if (data.token) {
      navigate.push('/');
    }
  }, [data]);

  useEffect(() => {

    if (error) {
      toast.error(error);
      alert(error)
      setData({
        _id: '', email: '', password: '', rol: '', token: '',
        name: ''
      });
    }
  }, [error]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    login(email, password);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="login-container" style={{ margin: '0 auto', maxWidth: '400px', marginTop: '100px', marginBottom: '100px' }}>
      <section className="heading">
        <h1>
          <FaSignInAlt /> Login
        </h1>
        <p>Sign in and start managing your crops</p>
      </section>

      <section className="form">
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              placeholder="Enter your email"
              onChange={onChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              placeholder="Enter your password"
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <button type="submit" className="btn btn-block">
              Submit
            </button>
          </div>
        </form>
        <p>Don't have an account? <Link href="/pages/Login/Register" className="text-decoration-none text-dark">Register <FaUser /></Link></p>
      </section>
    </div>
  );
}

export default Login;



```

# pages/Login/Elements/LinkAdaugaPostare.tsx

```tsx
import {FaUser} from 'react-icons/fa'
import Link from 'next/link'
import { useTranslations } from 'next-intl';

function LinkAdaugaPostare(){
  const t = useTranslations('LinkAdaugaPostare');
  return (
  <>
              <Link href='/pages/Login/Posts'>
                <FaUser /> {t('AdaugaPostare')}
              </Link>
              
                </>

  ) }

export default LinkAdaugaPostare


```

# pages/Login/Elements/page.tsx

```tsx
import {FaUser} from 'react-icons/fa'
import Link from 'next/link'
import { useTranslations } from 'next-intl';


function LinkParola(){
  const t = useTranslations('LinkParola');

  return (
  
              <Link href='/pages/Login/Modifica'>
                <FaUser /> {t('ModificaParola')}
              </Link>
  ) }


export default LinkParola


```

# pages/Login/Modify/page.tsx

```tsx
// @ts-nocheck
"use client"
import {useEffect, useState} from 'react'
import {useGlobalContext} from '../../../Context/UserStore'
import {useRouter} from 'next/navigation';
import {toast} from 'react-toastify'
import {FaUser} from 'react-icons/fa'
import Spinner from '../../../Crud/Spinner'

import "bootstrap/dist/css/bootstrap.min.css";
import { useTranslations } from 'next-intl';

function Modifica() {
  const t = useTranslations('Modifica');
  const navigate = useRouter()

  if (localStorage.getItem('user') === null) {
    navigate.push('/pages/Login/Login')
  }
  const [formData, setFormData] = useState({
    password: '',
    password2: '',
  })

  const { password, password2 } = formData

  

  const { isLoading, isError, message, modify, data, logout } = useGlobalContext()

  useEffect(() => {


    if (isError) {
      toast.error(message)
    }
   
  }, [ isError])

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  
  const onSubmit = (e) => {
    e.preventDefault()
    if (password !== password2) {
      toast.error( t('Passwords do not match'))
    } else {
      const userData = {
        password,
      }
      modify(data._id,userData.password)
      logout()
      navigate.push('/pages/Login/Login')
    }
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <>
      <section className='heading'>
        <h1>
          <FaUser /> {t('Modificare parola')}
        </h1>
      </section>

      <section className='form'>
        <form onSubmit={onSubmit}>

      
          <div className='form-group'>
            <input
              type='password'
              className='form-control'
              id='password'
              name='password'
              value={password}
              placeholder={t('Enter password')}
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <input
              type='password'
              className='form-control'
              id='password2'
              name='password2'
              value={password2}
              placeholder={t('Confirm password')}
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <button type='submit' className='btn btn-block'>
              {t('Submit')}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

export default Modifica




```

# pages/Login/Posts/page.tsx

```tsx
"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalContextPost } from '../../../Context/postStore';
import { useGlobalContext} from '../../../Context/UserStore';
import { useEffect } from 'react';
import Spinner from '../../../Crud/Spinner';
import { UserInfos } from '../Dashboard/userInfos';
import { Container, Card, Button } from 'react-bootstrap';
import PostForm from '../../../Crud/PostForm';
import Continut from '../../../Crud/GetAllPosts/page';
import { useTranslations } from 'next-intl';
function Postari() {
    const { data, loading, getAllPosts, deletePost , clearData } = useGlobalContextPost();

    const t = useTranslations('Postari');


useEffect(() => {
    const fetchData = async () => {
      clearData();


      await getAllPosts();
    };

    fetchData();
  }, []);


    return (
        <div>
            <Container>
                <Card>
                    <Card.Header>
                        <UserInfos />
                    </Card.Header>
                    <Card.Body>
                        <PostForm />
                    </Card.Body>
                </Card>
            </Container>
            <Container>
            </Container>

            <div>
                <h1>
                    {t('Postari')}
                </h1>
                <ul>
                    {Array.isArray(data) && data.map((post) => (
                    
                        <li key={post._id}>
                            <h2>{post.title}</h2>
                            <p>{post.brief}</p>
                            <Button variant="danger" onClick={() => deletePost(post._id)}>
                                {t('Sterge')}
                            </Button>
                            
                        </li>
                    ))}
                </ul>
            </div>

        </div>

    );
}

export default Postari;



```

# pages/Login/Register/page.tsx

```tsx
//ts-nocheck


"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation';
import {toast} from 'react-toastify'
import {FaUser} from 'react-icons/fa'
import Spinner from '../../../Crud/Spinner'
import {Form} from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import {useGlobalContext} from '../../../Context/UserStore';

function Register() {
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
  });

  const { role, name, email } = formData;

  const { data, setData, error, loading, register } = useGlobalContext();

  const navigate = useRouter();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      alert(error);
    }


    if ( data.role.toLowerCase() !== 'admin') {
      navigate.push('/');
      console.log('User is not admin' + data.role);
    }
  }, [error, data]);

  const onSubmit = (e) => {
    e.preventDefault();

      register(role, name, email);
    
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
       <div className="login-container" style={{ margin: '0 auto', maxWidth: '400px' , marginTop:'100px' , marginBottom:'100px' }}>
      <section className='heading'>
        <h1>
          <FaUser /> Register a user
        </h1>
      </section>

   
      <section className='form'>
        <Form onSubmit={onSubmit}>
          {data.role.toLowerCase() === 'admin' && (
            <div className='form-group'>
              <label>
                <select
                  aria-label='Role'
                  value={formData.role}
                  onChange={onChange}
                  name='role'
                  id='role'
                  className='form-control'
                >
                  <option>Select role</option>
                  <option value='farmer'>Farmer</option>
                  <option value='admin'>Administrator</option>
                </select>
              </label>
            </div>
          )}

          <div className='form-group'>
            <input
              type='text'
              className='form-control'
              id='name'
              name='name'
              value={formData.name}
              placeholder='Enter your name'
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <input
              type='email'
              className='form-control'
              id='email'
              name='email'
              value={formData.email}
              placeholder='Enter your email'
              onChange={onChange}
            />
          </div>
      <div className='form-group'>
        <button type='submit' className='btn btn-block' >
          Submit
        </button>
      </div>
    </Form>

  </section>
</div>
</>
);
}

export default Register;
```

# pages/Login/RotatieDashboard/Components/helperFunctions.js

```js
export const getCropsRepeatedBySelection = (crops, selections) => {
    let uniqueId = 0; // Initialize a unique ID counter
    return selections
      .map(selection => ({
        count: selection.selectionCount,
        cropId: selection.crop
      }))
      .flatMap(({ count, cropId }) => {
        const crop = crops.find(crop => crop._id === cropId);
        // Create an array with unique objects containing the crop and a unique ID
        return Array.from({ length: count }, () => ({ ...crop, uniqueId: uniqueId++ }));
      });
  };
  
  export const prepareChartData = (rotationPlan, numberOfDivisions) => {
    let chartData = [];
    let previousYearData = {};
    rotationPlan.forEach(yearPlan => {
      let yearData = { year: yearPlan.year };
      yearPlan.rotationItems.forEach(item => {
        yearData[`Parcela${item.division}`] = item.nitrogenBalance;
      });
  
      // Add missing divisions from the previous year
      for (let division = 1; division <= numberOfDivisions; division++) {
        const key = `Parcela ${division}`;
        if (!(key in yearData) && (key in previousYearData)) {
          yearData[key] = previousYearData[key];
        }
      }
      chartData.push(yearData);
      previousYearData = yearData;
    });
    return chartData;
  };
  
```

# pages/Login/RotatieDashboard/page.tsx

```tsx
"use client"
import { useState , useEffect } from 'react';
import { Container, Card, Row, Col, Table,  Button  } from 'react-bootstrap';
import { useGlobalContext } from '../../../Context/UserStore';
import { useGlobalContextCrop } from '../../../Context/culturaStore';
import Continut from '../../../Crud/GetAllInRotatie/page';
import CropRotationForm from './RotatieForm';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Label } from 'recharts';
import {  Typography } from 'antd';
const { Title } = Typography;
const colors = ['8884d8', '82ca9d', 'ffc658', 'a4de6c', 'd0ed57', 'ffc658', '00c49f', 'ff7300', 'ff8042'];
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import { getCropsRepeatedBySelection, prepareChartData } from './Components/helperFunctions';
import { useTranslations } from 'next-intl';

function RotatieDashboard() {
  const t = useTranslations('RotatieDashboard');
  const { crops,
    selections,
    isLoading,
     getCropRotation,
     cropRotation,
      updateNitrogenBalanceAndRegenerateRotation,
       getAllCrops,
        updateDivisionSizeAndRedistribute,
        deleteCropRotation
       } = useGlobalContextCrop();

   const { data: userData } = useGlobalContext();
  const [divisionSizeValues, setDivisionSizeValues] = useState([]);
const [nitrogenBalanceValues, setNitrogenBalanceValues] = useState([]);
const [cropRotationChange, setCropRotationChange] = useState(false);
const { user, error, isLoading: isUserLoading } = useUser();
const [visible, setVisible] = useState(6);

///data  is changed but functions might not be rerernderedb n
useSignals();
  const fetchData =  () => {

     getAllCrops()
    getCropRotation()

  };
const [rotationPage, setRotationPage] = useState(0);
const rotationsPerPage = 1;

useEffect(() => {
  if (!isUserLoading) {
    fetchData();
  }
}, [isUserLoading]);

  if (isLoading.value) {
    return <div>
      {t('Loading')}
      { isLoading.value  }</div>;
  }
 
    if (cropRotationChange) {
      console.log('cropRotationChange did change')
      getCropRotation();
      setCropRotationChange(false);
    }

  const filteredCrops = getCropsRepeatedBySelection(crops.value, selections.value);
  const showMore = () => {
    setVisible(prevVisible => prevVisible + 6);
};

  if (userData?.role?.toLowerCase() === 'farmer') {
    return (
      <>
        <Container style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <Card style={{ padding: '2rem' }}>
            <section className="heading" style={{ marginBottom: '1rem' }}>
              <h1>Salut {userData && userData.name}</h1>
            </section>
            <section className="content">
              {crops?.value?.length > 0 ? (
                <div className="crops">
                  <CropRotationForm filteredCrops={filteredCrops}  />
                  
                  <h3>
                    {
                      t('Culturi selectate')
                    }
                  </h3>

                  {filteredCrops.length === 0 ? (
                    <p>
                      {
                        t('Nicio cultura selectata')
                      }
                    </p>
                  ) : (
                    <>
                    <Row>
                        {filteredCrops.slice(0, visible).map((crop, index) => (
                            <Col key={index} xs={12} sm={6} md={4}>
                                <Continut crop={crop} />
                            </Col>
                        ))}
                    </Row>
                    {filteredCrops.length > visible && (
                        <div className="text-center">
                            <Button onClick={showMore}>
                                {
                                  t('Vezi mai mult')
                                }
                            </Button>
                        </div>
                    )}
                </>
                  )}
                </div>
              ) : (
                <h3>
                  {
                    t('Nu exista culturi')
                  }
                </h3>
              )}

{cropRotation.value && cropRotation.value.data && (
  <div className="rotation" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
    <h3>
      {
        t('Rotatii')
      }
    </h3>
    {cropRotation.value && Array.isArray(cropRotation.value.data) && (
      cropRotation.value.data
        .slice(rotationPage * rotationsPerPage, (rotationPage + 1) * rotationsPerPage)
        .map((rotation, index) => {

                    
                    const chartData = prepareChartData(rotation.rotationPlan, rotation.numberOfDivisions);
                    return (
                      <Row key={index}>
                        <Col xs={12} md={6}>
                          <h2>{rotation.rotationName}</h2>
                          
                          <p> {t('Dimensiune camp')}  {rotation.fieldSize}</p>
                     
                          <p> {t('Numar de diviziuni')}  {rotation.numberOfDivisions}</p>
                        
                          
                          {rotation.rotationPlan.map((plan, planIndex) => (
                            <div key={planIndex}>
                              <h3> { t('anul')}  {plan.year}</h3>
                              <Table striped bordered hover>
                                <thead>
                                  <tr>
                                    <th>
                                      {t('Diviziune')}
                                    </th>
                                    <th>
                                      {t('Nume cultura')}
                                    </th>
                                    <th>
                                      {t('Data plantarii')}
                                    </th>
                                    <th>
                                      {t('Data recoltarii')}
                                    </th>
                                    <th>
                                      {t('Dimensiune diviziune')}
                                    </th>
                                    <th>
                                      {t('Bilant azot')}
                                    </th>
                                    <th>
                                      {t('Azot suplimentar')}
                                    </th>
                                    <th>
                                      {
                                        planIndex === 0 && (
                                          <button
                                            onClick={() => {
                                              deleteCropRotation(rotation._id);
                                            }
                                          }
                                          >
                                            {t('Sterge rotatie')}
                                          </button>
                                        )
                                      }
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {plan.rotationItems.map((item, itemIndex) => (
                                    <tr key={itemIndex}>
                                      
                                      <td><b>{item.division}</b></td>
                                      <td>{item.cropName}</td>
                                      <td>{item.plantingDate.toString().slice(0, 10)}</td>
                                      <td>{item.harvestingDate.toString().slice(0, 10)}</td>
                                      <td>{item.divisionSize}
                                      {planIndex === 0 && ( // Show input only in the first year
                                        <input type="text" 
                                        placeholder="
                                        {t('Dimensiune diviziune')}" 
                                        value={divisionSizeValues[itemIndex] || ''} 
                                        onChange={e => {
                                          let newDivisionSizeValues = [...divisionSizeValues];
                                          newDivisionSizeValues[itemIndex] = e.target.value;
                                          setDivisionSizeValues(newDivisionSizeValues);
                                        }}
                                        onBlur={e => {
                                          if (isNaN(parseFloat(e.target.value)) && parseFloat(e.target.value) > 0) {
                                            alert("Not a number");
                                          }        else if (parseFloat(e.target.value) > 1) {
                                            let newDivisionSizeValues = [...divisionSizeValues];
                                            newDivisionSizeValues[itemIndex] = parseFloat(e.target.value);
                                            setDivisionSizeValues(newDivisionSizeValues);
                                            let data :any = {
                                              id: rotation._id,
                                              rotationName: rotation.rotationName,
                                              division: item.division,
                                              newDivisionSize: parseFloat(e.target.value),
                                            };
                                            updateDivisionSizeAndRedistribute(data);
                                            
                                          }
                                          if(parseFloat(e.target.value) > 0 ) {
                                            setCropRotationChange(true)
                                            }
                                        }}
                                      />
                                      )}
                                      </td>
                                      <td>{item.nitrogenBalance} 
                                      <input type="text" 
                                        placeholder="Supplemental nitrogen" 
                                        value={nitrogenBalanceValues[itemIndex] || ''} 
                                        onChange={e => {
                                          let newNitrogenBalanceValues = [...nitrogenBalanceValues];
                                          newNitrogenBalanceValues[itemIndex] = e.target.value;
                                          setNitrogenBalanceValues(newNitrogenBalanceValues);
                                        }} 
                                        onBlur={e => {
                                          if (isNaN(parseFloat(e.target.value)) && parseFloat(e.target.value) > 0) {
                                            alert(t('Not a number'));
                                          } else if (parseFloat(e.target.value) > 1) {
                                            let newNitrogenBalanceValues = [...nitrogenBalanceValues];
                                            newNitrogenBalanceValues[itemIndex] = parseFloat(e.target.value);
                                            setNitrogenBalanceValues(newNitrogenBalanceValues);
                                            let data :any = {
                                              id: rotation._id,
                                              rotationName: rotation.rotationName,
                                              year: plan.year,
                                              division: item.division,
                                              nitrogenBalance: parseFloat(e.target.value),
                                            };
                                            updateNitrogenBalanceAndRegenerateRotation(data);
                                            
                                          }
                                          if(parseFloat(e.target.value) > 0 ) {
                                          setCropRotationChange(true)
                                          }
                                        }}
                                      />
                                      </td>
                                      <td>{(item.nitrogenBalance * (item.divisionSize / 10000)).toFixed(2)} </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ))}
                        </Col>
                        <Col xs={24} md={12}>
                          <Title level={3}>
                            {t('anual evolution')}
                          </Title>
                          <ResponsiveContainer width="100%" height={500}>
                            <LineChart
                              width={500}
                              height={300}
                              data={chartData}
                              margin={{
                                top: 5, right: 30, left: 20, bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" padding={{ left: 30, right: 30 }}>
                                <Label value="Year" offset={-5} position="insideBottom" />
                              </XAxis>
                              <YAxis label={{ value: 'Nitrogen balance', angle: -90, position: 'insideLeft' }} />
                              <Tooltip />
                              <Legend />

                              {chartData[0] && Object.keys(chartData[0]).map((key, i) => {
                                if (key !== 'year') {
                                  return (
                                    <Line type="monotone" dataKey={key} stroke={`#${colors[i % colors.length]}`} activeDot={{ r: 8 }} />
                                  );
                                }
                              })}
                            </LineChart>
                          </ResponsiveContainer>
                        </Col>
                      </Row>
                    );
                  }
                ))}
                </div>
              )}
            </section>
          </Card>

          {rotationPage > 0 && (
          <Button onClick={() => setRotationPage(prevPage => prevPage - 1)}>Previous</Button>
        )}
        {(rotationPage + 1) * rotationsPerPage < cropRotation.value?.data?.length && (
          <Button onClick={() => setRotationPage(prevPage => prevPage + 1)}>Next</Button>
        )}

        
        </Container>
      </>
    );
  } else {
    return null;
  }
}
export default RotatieDashboard;
                                              

```

# pages/Login/RotatieDashboard/RotatieDashboard.module.scss

```scss
.rotationItem {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .chart {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .fieldInfo {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
```

# pages/Login/RotatieDashboard/RotatieForm.tsx

```tsx
import React, { useState } from 'react';
import { useGlobalContextCrop } from '../../../Context/culturaStore';
import { useTranslations } from 'next-intl';

const CropRotationForm = ({ filteredCrops }) => {

  const t = useTranslations('CropRotationForm');
  const [fieldSize, setFieldSize] = useState('');
  const [numberOfDivisions, setNumberOfDivisions] = useState('');
  const [rotationName, setRotationName] = useState('');
  const [maxYears, setMaxYears] = useState('');
  const [ResidualNitrogenSupply, setResidualNitrogenSupply] = useState(''); 

  const { generateCropRotation } = useGlobalContextCrop();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      parseInt(fieldSize) > 0 &&
      parseInt(numberOfDivisions) > 0 &&
      rotationName &&
      parseInt(maxYears) > 0
    ) {
      generateCropRotation(
        parseInt(fieldSize),
        parseInt(numberOfDivisions),
        rotationName,
        filteredCrops,
        parseInt(maxYears),
        parseInt(ResidualNitrogenSupply)
      );
      setFieldSize('');
      setNumberOfDivisions('');
      setRotationName('');
      setMaxYears('');
      setResidualNitrogenSupply('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="fieldSize">
          { t('fieldSize') }*:
        </label>
        <input
          type="number"
          className="form-control"
          id="fieldSize"
          value={fieldSize}
          onChange={(e) => setFieldSize(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="numberOfDivisions">
          { t('numberOfDivisions') }*:
        </label>
        <input
          type="number"
          className="form-control"
          id="numberOfDivisions"
          value={numberOfDivisions}
          onChange={(e) => setNumberOfDivisions(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rotationName">
          { t('rotationName') }*:
        </label>
        <input
          type="text"
          className="form-control"
          id="rotationName"
          value={rotationName}
          onChange={(e) => setRotationName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="maxYears">
          { t('maxYears') }*:
        </label>
        <input
          type="number"
          className="form-control"
          id="maxYears"
          value={maxYears}
          onChange={(e) => setMaxYears(e.target.value)}
        />
      </div>
      <div className="form-group">
      <label htmlFor="maxYears">
        { t('ResidualNitrogenSupply') }*:
      </label>
      <input
          type="number"
          className="form-control"
          id="ResidualNitrogenSupply"
          value={ResidualNitrogenSupply}
          onChange={(e) => setResidualNitrogenSupply(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        { t('generateCropRotation') } 
      </button>
    </form>
  );
};

export default CropRotationForm;


```

# pages/News/Components/debounce.js

```js
export default function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
```

# pages/News/Components/scrollHandler.js

```js
import debounce from './debounce';

export const handleScroll = (loadMorePosts) => {
  if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) return;
  loadMorePosts();
};

export const loadMorePosts = async (setLoadingMore, error, getAllPosts, page, setPage, setHasMore) => {
  setLoadingMore(true);

  if (error === "No more posts") {
    console.log("erarea" + error)
    setHasMore(false);
  } else {
    await getAllPosts(page);
    setPage(page + 1);
  }
  setLoadingMore(false);
};

```

# pages/News/News.tsx

```tsx
import React, { useEffect } from 'react';
import Spinner from '../../Crud/Spinner';
import { useGlobalContextPost } from '../../Context/postStore';
import Continut from '../../Crud/GetAllPosts/page';
import Card from 'react-bootstrap/Card';
import { useTranslations } from 'next-intl';

export default function Noutati() {
  const { data, loading, getAllPosts, clearData } = useGlobalContextPost();
  const t = useTranslations('News');

  useEffect(() => {
    const fetchData = async () => {
      clearData();
      await getAllPosts(0);
    };

    fetchData();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  // const data = allData.posts;
  console.log(data, 'data');

  // Check if data is available before rendering
  if (!data) {
    return null;
  }

  // Sort the data to get the two most recent posts
  let latestPosts = [];
  if (data && Array.isArray(data)) {
    latestPosts = [...data].sort((a, b) => b.date - a.date).slice(0, 2);
  } 

  return (
    <div className="container">
      <br />
      <br />
      <p>{t('Latest in our newsfeed:')}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {latestPosts.map((post) => {
          return (
            <Card key={post._id} style={{ marginBottom: '20px' }}>
              <Card.Body>
                <Continut data={post} />
                <p>{new Date(post.date).toLocaleDateString()}</p>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </div>
  );
}




```

# pages/News/page.tsx

```tsx
"use client"
import { useEffect, useState } from 'react';
import Spinner from '../../Crud/Spinner';
import { useGlobalContextPost } from '../../Context/postStore';
import Continut from '../../Crud/GetAllPosts/page';
import { handleScroll, loadMorePosts } from './Components/scrollHandler';
import debounce from './Components/debounce';
import { useTranslations } from 'next-intl';


export default function Noutati() {
  const { data, loading, getAllPosts , error , clearData} = useGlobalContextPost();
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const t = useTranslations('News');

  useEffect(() => {
    const fetchData = async () => {
      clearData();
      await loadMorePosts(setLoadingMore, error, getAllPosts, page, setPage, setHasMore);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const debouncedHandleScroll = debounce(handleScroll, 100);
    window.addEventListener('scroll', debouncedHandleScroll);
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [page, loadingMore, hasMore]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container">
      <h1 className="mt-5 mb-4">Our latest news:</h1>
      {data.length > 0 ? (
        <div>
          {data.map((data) => {
            return (
              <div key={data._id} className="mb-5 border-bottom pb-4">
                <Continut data={data} />
              </div>
            );
          })}
          {loadingMore && <Spinner />}
        </div>
      ) : (
        <h3 className="mb-5">Nothing to see at the moment</h3>
      )}
    </div>
  );
}




```

# pages/Recomandari/page.tsx

```tsx
"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalContextCrop } from "../../Context/culturaStore";
import { useGlobalContext } from "../../Context/UserStore";
import useRecommendations from "./recomandari";
import { Alert, Container, Card, Table } from "react-bootstrap";
import React from "react";


function RotationItem({ item }) {
  const recommendations = useRecommendations(item.nitrogenBalance, item.crop);

  return (
    <tr>
      <th>{item.division}</th>
      <td>{item.cropName}</td>
      <td>{item.plantingDate.toString().slice(0, 10)}</td>
      <td>{item.harvestingDate.toString().slice(0, 10)}</td>
      <td>{item.divisionSize}</td>
      <td>{item.nitrogenBalance}</td>
      <td>
        <ul>
          {recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

function RecommendationDashboard() {
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState("");
  const { data } = useGlobalContext();
  const token = data?.token; 
  const { getCropRotation, cropRotation } = useGlobalContextCrop();
  const navigate = useRouter();

  useEffect(() => {
    if (isError) {
      console.error(message);
    }
    if (!data) {
      navigate.replace('/login');
    } else {
      getCropRotation(token);
    }
  }, [token, isError, message, data, navigate]);

  if (isError) {
    return <Alert variant="danger">{message}</Alert>;
  }

  if (data?.rol === "Fermier") {
    return (
      <Container className="mt-4 mb-4">
        <Card className="p-4">
          <section className="heading mb-3">
            <h1>Hello {data && data.name}</h1>
          </section>
          <section className="content">
            {Array.isArray(cropRotation) && (
              <div className="rotation mt-4 mb-4">
                <h3>Recommendations based on crop rotation:</h3>
                {cropRotation.map((rotation, index) => (
                  <div key={index}>
                    <h2>{rotation.rotationName}</h2>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Division</th>
                          <th>Crop</th>
                          <th>Planting Date</th>
                          <th>Harvesting Date</th>
                          <th>Division Size</th>
                          <th>Nitrogen Balance</th>
                          <th>Recommendations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rotation.rotationPlan.map((plan, planIndex) => (
                          <React.Fragment key={planIndex}>
                            <tr>
                              <th colSpan="7">Year: {plan.year}</th>
                            </tr>
                            {plan.rotationItems.map((item, itemIndex) => (
                              <RotationItem key={itemIndex} item={item} />
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </section>
        </Card>
      </Container>
    );
  }

  return null;
}

export default RecommendationDashboard;
```

# pages/Recomandari/recomandari.tsx

```tsx
import { useGlobalContextCrop } from '../../Context/culturaStore';
import { useEffect, useState } from 'react';

export default function useRecommendations(nitrogenBalance, cropId) {
  const { SinglePage, singleCrop } = useGlobalContextCrop();
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    SinglePage(cropId);
  }, [cropId]);

  useEffect(() => {
    if (singleCrop) {
      const newRecommendations = [];

      // Handle nitrogen balance
      newRecommendations.push(
        nitrogenBalance < singleCrop.nitrogenDemand - 50
          ? 'Nivelul azotului este scăzut. Este recomandat să folosiți un îngrășământ bogat în azot. Mai este nevoie de ' + (singleCrop.nitrogenDemand - nitrogenBalance) + ' unitati'
          : nitrogenBalance < singleCrop.nitrogenDemand
          ? 'Nivelul azotului este moderat. Este recomandat să continuați cu practicile curente de fertilizare. Mai este nevoie de ' + (singleCrop.nitrogenDemand - nitrogenBalance) + ' unitati'
          : 'Nivelul azotului este ridicat. Este recomandat să reduceți utilizarea de îngrășăminte cu azot.'
      );

      // Handle crop type
      switch (singleCrop.cropType) {
        case 'Cereală':
          newRecommendations.push(
            'Culturile de cereale pot beneficia de îngrășăminte fosfatate pentru a îmbunătăți randamentul recoltei.'
          );
          break;
        case 'Leguminoasă':
          newRecommendations.push(
            'Culturile de leguminoase pot beneficia de inoculare cu bacterii fixatoare de azot pentru a îmbunătăți randamentul recoltei.'
          );
          break;
        case 'Fruct':
          newRecommendations.push(
            'Culturile de fructe pot beneficia de îngrășăminte bogate în potasiu pentru a îmbunătăți calitatea fructelor.'
          );
          break;
        default:
          newRecommendations.push('Încă nu avem informații despre această cultură.');
          break;
      }

      setRecommendations(newRecommendations);
    }
  }, [singleCrop, nitrogenBalance, cropId]);

  return recommendations;
}
```

# pages/Recomandari/VremeFetch.tsx

```tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_KEY = 'YOUR_API_KEY';
const CITY = 'Cluj Napoca,RO';
const DAYS = 7;
const API_ENDPOINT = `http://api.openweathermap.org/data/2.5/forecast/daily?q=${CITY}&cnt=${DAYS}&appid=${API_KEY}&units=metric`;

export interface WeatherData {
  date: string;
  temperature: number;
  description: string;
  precipitation: number;
}

export default const WeatherTable: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);

  useEffect(() => {
    axios.get(API_ENDPOINT)
      .then(response => {
        const data = response.data;
        const weatherData: WeatherData[] = data.list.map((day: any) => ({
          date: new Date(day.dt * 1000).toLocaleDateString(),
          temperature: day.temp.day,
          description: day.weather[0].description,
          precipitation: day.rain ? day.rain : 0
        }));
        setWeatherData(weatherData);
      })
      .catch(error => console.error(error));
  }, []);
};


```

# pages/Rotatie/Components/App.tsx

```tsx
import { useState } from 'react';
import styles from '../Rotatie.module.css';
import CropsList from './CropsList';
import Pagination from './Pagination';
import NoCrops from './NoCrops';

interface Crop {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
}


function App({ crops, areThereCrops }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 6;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Filter crops based on search term
  const filteredCrops = crops.filter(crop => {
    const regex = new RegExp(searchTerm, 'i');
    return regex.test(crop.cropName) || regex.test(crop.cropType) || regex.test(crop.cropVariety);
  });

  const currentItems = filteredCrops.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCrops.length / itemsPerPage);

  return (
    <div className={` text-center `}>
      <input
        type="text"
        placeholder="Search crops..."
        value={searchTerm}
        onChange={handleSearch}
        className={styles.searchInput}
      />

      {areThereCrops ? (
        <CropsList crops={currentItems} />
      ) : (
        <NoCrops />
      )}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default App;

```

# pages/Rotatie/Components/CropsList.tsx

```tsx
import GridGenerator from '../../../Componente/GridGen';
import Continut from '../../../Crud/GetAllInRotatie/page';
import styles from '../Rotatie.module.css';

interface Crop {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
}

interface CropsListProps {
  crops: Crop[];
}

function CropsList({ crops }: CropsListProps) {
  return (
    <div>
      <GridGenerator cols={3}>
        {crops.map((crop) => (
          <div className={styles.gridItem} key={crop._id}>
            <Continut crop={crop} />
          </div>
        ))}
      </GridGenerator>
    </div>
  );
}

export default CropsList;

```

# pages/Rotatie/Components/NoCrops.tsx

```tsx
import styles from '../Rotatie.module.css';
import { useTranslations } from 'next-intl';

function NoCrops() {
  const t = useTranslations('NoCrops');
  return (
    <div className={styles.noCrops}>
      <h3>
        {t('noCrops')}
      </h3>
      <p>
        {t('noCropsMessage')}
      </p>
    </div>
  );
}

export default NoCrops;



```

# pages/Rotatie/Components/Pagination.tsx

```tsx
import styles from '../Rotatie.module.css';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

function Pagination({ totalPages, currentPage, onPageChange }: PaginationProps) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className={styles.pagination}>
      {pages.map((page) => (
        <button
          key={page}
          className={`${styles.pageButton} ${page === currentPage ? styles.active : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

export default Pagination;

```

# pages/Rotatie/page.tsx

```tsx
'use client'
import { useEffect, useState } from 'react';
import Spinner from '../../Crud/Spinner';
import Continut from '../../Crud/GetAllInRotatie/page';
import GridGenerator from '../../Componente/GridGen';
import styles from './Rotatie.module.css';
import { useGlobalContextCrop } from '../../Context/culturaStore';
import { useSignals } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import App from './Components/App';

export default function Rotatie() {
  const { crops, isLoading, getAllCrops, areThereCrops } = useGlobalContextCrop();
  const { user, error, isLoading: isUserLoading } = useUser();

  useSignals();

  useEffect(() => {
    if (!isUserLoading) {
      getAllCrops();
    }
  }, [isUserLoading]);

  if (isLoading.value || isUserLoading) {
    return (
      <div>
        <Spinner />
        <p>Loading crops ...</p>
      </div>
    );
  }

  return <App crops={crops.value} areThereCrops={areThereCrops.value} />;
}



```

# pages/Rotatie/Rotatie.module.css

```css
.container {
    padding-bottom: 4rem;
    border: 1px solid #ccc; 
  }
  
  .title {
    margin-bottom: 3rem;
    font-size: 2rem; 
    color: #333; 
  }
  
  .gridContainer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: stretch; 
  }
  
  .gridItem {
    flex: 1 0 calc(33.33% - 1rem); 
    box-sizing: border-box;
    margin-bottom: 4rem;
    border: 1px solid #ccc; 
    padding: 1rem; 
    display: flex; 
    flex-direction: column; 
  }
  
  .gridItem > * {
    margin-bottom: auto; 
  }
  
  .noContent {
    color: red; 
  }
  
```

