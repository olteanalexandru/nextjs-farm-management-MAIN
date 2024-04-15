//export 
export {};
const mongoose = require('mongoose');
const Crop = require('./cropModel');

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
      type: mongoose.Schema.Types.ObjectId,
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
rotationItemSchema.pre('save', function (next) {
  if (this.crop) {
    Crop.findById(this.crop, (err, crop) => {
      if (err) return next(err);
      this.cropName = crop.cropName;
      next();
    });
  } else {
    next();
  }
});

export default mongoose.models.Rotation || mongoose.model('Rotation', rotationSchema);