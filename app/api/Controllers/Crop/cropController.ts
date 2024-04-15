const asyncHandler = require('express-async-handler');

import Crop from '../../Models/cropModel';
import User from '../../Models/userModel';

import { CustomRequest } from '../interfaces/CropInterfaces';


// Interface for Response
interface Response {
  status: any;
  json: (arg0: any) => void;
  send: (arg0: string) => void;
}
interface Request {
  user: { _id: number };
  body: {
    cropName: string;
    cropType: string;
    cropVariety: string;
    plantingDate: string;
    harvestingDate: string;
    soilType: string;
    selectare: boolean;
    numSelections: number;
    _id: number;
  };
  params: { id: number };
  query: { cropName: any };
}

class CropController {

  //constructor
  constructor() {
    this.getCrop = this.getCrop.bind(this);
    this.getAllCrops = this.getAllCrops.bind(this);
    this.getSpecificCrop = this.getSpecificCrop.bind(this);
    this.setCrop = this.setCrop.bind(this);
    this.updateCrop = this.updateCrop.bind(this);
    this.deleteCrop = this.deleteCrop.bind(this);
    this.setSelectare = this.setSelectare.bind(this);
    this.addCropRecommendation = this.addCropRecommendation.bind(this);
    this.getCropRecommendations = this.getCropRecommendations.bind(this);

    
  }

  router = require('express').Router();

  // GET /api/crops
  getCrop = asyncHandler(async (req: CustomRequest, res: Response) => {
    const crops = await Crop.find({ user: req.user._id });
    res.status(200).json(crops);
  });

  // GET /api/crops/crops
  getAllCrops = asyncHandler(async (req: Request, res: Response) => {
    const crops = await Crop.find({});
    if (!crops) {
      res.status(404).send('Crop not found');
      return;
    }
    const filteredCrops = crops.filter((crop) =>
      crop.cropType && crop.cropVariety && crop.plantingDate && crop.harvestingDate && crop.soilType
    );
    res.status(200).json(filteredCrops);
  });

  // GET /api/crops/crops/:id
  getSpecificCrop = asyncHandler(async (req: CustomRequest, res: Response) => {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      res.status(404).send('Crop not found');
      return;
    }
    res.status(200).json(crop);
  });

  // POST /api/crops
  setCrop = asyncHandler(async (req: CustomRequest, res: Response) => {
    if (!req.body.cropName) {
      res.status(400).send('Crop name is required');
      return;
    }
    const crop = await Crop.create({ ...req.body, user: req.user._id });
    res.status(201).json(crop);
  });

  // PUT /api/crops/crops/:id
  updateCrop = asyncHandler(async (req: CustomRequest, res: Response) => {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      res.status(404).send('Crop not found');
      return;
    }
    if (crop.user.toString() !== req.user._id) {
      res.status(401).send('User not authorized');
      return;
    }
    const updatedCrop = await Crop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedCrop);
  });

  // DELETE /api/crops/crops/:id
  deleteCrop = asyncHandler(async (req: CustomRequest, res: Response) => {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      res.status(404).send('Crop not found');
      return;
    }
    if (crop.user.toString() !== req.user._id) {
      res.status(401).send('User not authorized');
      return;
    }
    await crop.remove();
    res.status(200).json({ message: 'Crop removed' });
  });

  // Additional methods (SetSelectare, addCropRecommendation, getCropRecommendations, etc.)

  // POST /api/crops/crops/:id/selectare

  setSelectare = asyncHandler(async (req: CustomRequest, res: Response) => {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      res.status(403).send('Crop not found');
      return;
    }
    if (req.body.selectare === undefined || req.body.numSelections === undefined) {
      res.status(400).send('Missing selectare data');
      return;
    }
    if (!req.user) {
      res.status(401).send('User not found');
      return;
    }
    let selectare = req.body.selectare;
    let selectareBy = req.body._id;
    let numSelections = req.body.numSelections;
    // Fetch user
    const user = await User.findById(selectareBy);
    if (!user) {
      res.status(404).send('User not found');
      return;
    }
    if (!selectare) {
      // Deselecting
      selectare = false;
      selectareBy = null;
      // Remove crop id from user's selectedCrops
      user.selectedCrops = user.selectedCrops.filter((c) => c.toString() !== req.params.id);
      user.selectareCount = (user.selectareCount || numSelections) - numSelections;
    } else {
      // Selecting
      // Increment selection count for the user
      user.selectareCount = (user.selectareCount || 0) + numSelections;
      // Add crop id to user's selectedCrops
      for (let i = 0; i < numSelections; i++) {
        if (!user.selectedCrops.includes(req.params.id)) {
          user.selectedCrops.push(req.params.id);
        }
      }
    }
    await user.save();
    const selectareCrop = await Crop.findByIdAndUpdate(req.params.id, {
      selectare: selectare,
      selectareBy: selectareBy,
    });
    res.status(200).json(selectareCrop);
  });

  // PUT /api/crops/crops/:id/recommendations
  addCropRecommendation = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { cropName, nitrogenSupply, nitrogenDemand, pests, diseases } = req.body;
    // Try to find the crop with the given name
    let crop = await Crop.findOne({ cropName });
    // If crop doesn't exist, create a new one
    if (!crop) {
      crop = new Crop({
        user: req.user._id,
        cropName,
        nitrogenSupply,
        nitrogenDemand,
        pests,
        diseases,
      });
    } else {
      // If crop exists, update it with the new recommendations
      crop.nitrogenSupply = nitrogenSupply;
      crop.nitrogenDemand = nitrogenDemand;
      crop.pests = pests;
      crop.diseases = diseases;
    }
    if (!crop) {
      res.status(400).send('Crop not found');
      return;
    }
    if (!req.user) {
      res.status(401).send('User not found');
      return;
    }
    if (req.user.rol !== 'Administrator') {
      res.status(401).send('User not authorized');
      return;
    }
    // Save the new or updated crop
    const updatedCrop = await crop.save();
    // Return the new or updated crop
    res.status(200).json(updatedCrop);
  });

  // GET /api/crops/crops/recommendations
  getCropRecommendations = asyncHandler(async (req: CustomRequest, res: Response) => {
    const cropName = req.query.cropName;
    // Use regex for pattern match, case insensitive
    const crop = await Crop.find({ cropName: { $regex: new RegExp(String(cropName)), $options: 'i' } });
    // If no crop is found, return an empty array
    if (!crop) {
       res.status(200).json([]);
    }
    // Map over the results to return an array of crops with required fields
    const crops = crop.map((c) => ({
      cropName: c.cropName,
      diseases: c.diseases,
      pests: c.pests,
      nitrogenSupply: c.nitrogenSupply,
      nitrogenDemand: c.nitrogenDemand,
    }));
    res.status(200).json(crops);
  });
}

export default CropController;
