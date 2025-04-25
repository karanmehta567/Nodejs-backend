import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.SECRET_kEY,
})
export const fileUploadtoCloudianry = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        //lets upload it
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        console.log('Success while uploading file to cloudinary', response.url)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}