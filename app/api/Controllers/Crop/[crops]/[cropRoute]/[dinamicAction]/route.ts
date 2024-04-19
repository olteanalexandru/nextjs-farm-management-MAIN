import { NextResponse , NextRequest } from 'next/server';
import Crop from '../../../../../Models/cropModel';
import User from '../../../../../Models/userModel';
import { connectDB } from '../../../../../../db';
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


export async function GET(request: NextRequest,context: any) {
  const { params } = context;
  let crops;
  let message = 'No more crops';
  if(params.crops === 'crops' &&  params.cropRoute == "search"){
    crops = await Crop.find({ cropName: { $regex: params.dinamicAction, $options: 'i' } });
    console.log("triggered crop")
  } else if (params.crops === 'crop' && params.cropRoute == "id" ){
   
      let UserId
   UserId =   User.findOne(params.dinamicAction);
   UserId ? crops = await Crop.find({ user: UserId }) : message = 'User ID not found';
  
    //recommandations
   } else if(params.crops === 'crops' && params.cropRoute == "recommendations"){
      crops = await Crop.find({ cropName: { $regex: params.dinamicAction, $options: 'i' } });
      crops.map((c) => ({
         cropName: c.cropName,
         diseases: c.diseases,
         pests: c.pests,
         nitrogenSupply: c.nitrogenSupply,
         nitrogenDemand: c.nitrogenDemand,
         }));
         console.log("triggered crop")
         return NextResponse.json( {crops,message});
   } else if(
 params.crops === 'crops' && 
      params.cropRoute == "retrieve" && params.dinamicAction == "all"
   ) {
      
      crops = await Crop.find();
   }
     
  console.log("crop get triggered")
  return NextResponse.json( {crops,message});
}

//POST paths and params docs
// for single crop
// API_URL + "/crops/crop/id/" + id
// for recommendations
// API_URL + "/crops/crops/recommendations " + id

export async function POST(request: NextRequest,context: any) {


  const { params } = context;
  // post request for crop recommendations
  if (
      params.crops === 'crops' && params.cropRoute == "recommendations" 
   ) {
      const { cropName, nitrogenSupply, nitrogenDemand, pests, diseases } = await request.json();
      let crop = await Crop.findOne({ cropName });
      let user = await User.findOne(params.dinamicAction);
      if (!user) {
         return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      if (!crop) {
         crop = new Crop({
         user: user.auth0_id,
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
      if (!crop) {
         return NextResponse.json({ message: 'Crop not found' }, { status: 400 });
      }

   
      const updatedCrop = await crop.save();
      return NextResponse.json(updatedCrop, { status: 200 });
      // post request for crop  --------------------------
   } else if (params.crops === 'crop' && params.cropRoute === 'single' ) {
      const { cropName, cropType, cropVariety, plantingDate, harvestingDate, soilType } = await request.json();
      if (!cropName) {
         return NextResponse.json({ message: 'Crop name is required' }, { status: 400 });
      }
      const crop = await Crop.create({ ...request.body, user: params.dinamicAction });
      return NextResponse.json(crop, { status: 201 });
   } else {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
   }
}

//PUT paths and params docs
// for single crop
// API_URL + "/crops/crops/cropid/" + userid
// API_URL + "/crops/crops/id/" + id + "/recommendations"

export async function PUT(request: NextRequest,context: any) {
   const { params } = context;
   if (
         params.crops === 'crop' 
    ) {
         const { cropName, nitrogenSupply, nitrogenDemand, pests, diseases } = await request.json();
         let crop = await Crop.findOne(params.cropRoute);
 
         const user = await User.findOne(params.dinamicAction);
         if (!crop) {
            return NextResponse.json({ message: 'Crop not found' }, { status: 404 });
         }
         if (!params.dinamicAction) {
            return NextResponse.json({ message: 'User not found' }, { status: 401 });
         }
         if (!user.role.includes('Administrator') ) {
            return NextResponse.json({ message: 'User not authorized' }, { status: 401 });
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
    }   

}

//DELETE paths and params docs
// for single crop
// API_URL + "/crops/crops/:userId/" + :cropId

export async function DELETE(request: NextRequest,context: any) {
   const { params } = context;
   if (params.crops === 'crop' ) {
      const user = await User.findOne(params.cropRoute);
      const crop = await Crop.findById(params.dinamicAction);
      if (!crop) {
         return NextResponse.json({ message: 'Crop not found' }, { status: 404 });
      }
      if (!user) {
         return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      if (user._id !== crop.user.toString()) {
         return NextResponse.json({ message: 'User not authorized' + user._id + crop.user.toString() }, { status: 401 });
      }
      await crop.remove();
      return NextResponse.json({ message: 'Crop deleted' }, { status: 200 });
   } 
   return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
}




 




