import mongoose from "mongoose";


const cropSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
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