
import mongoose from 'mongoose'




const userSchema = new mongoose.Schema({
  rol: {
    type: String,
    enum: {
      values: ['Fermier', 'Administrator'],
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
  password: {
    type: String,
    required: [true, 'Please add a password']
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
