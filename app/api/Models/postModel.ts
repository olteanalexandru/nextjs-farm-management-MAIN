import mongoose from "mongoose"

const postSchema = new mongoose.Schema({
    //linking to user
    user: {
        type: mongoose.Schema.Types.ObjectId,
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



