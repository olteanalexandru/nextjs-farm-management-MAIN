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