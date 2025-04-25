import mongoose from "mongoose";
const subSchema = new mongoose.Schema({

    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })
export const subModel = mongoose.model('subscription', subSchema)