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




 








