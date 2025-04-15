import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String,
        required: true// clodinary url
    },
    thumbNail: {
        type: String, //cloudinary
        required: true
    },
    title: {
        type: String,
        requiredLtrue
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    Owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model('Video', videoSchema)