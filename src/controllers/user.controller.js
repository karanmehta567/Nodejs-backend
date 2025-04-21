import { User } from "../models/userModel.js";
import { asyncHandler } from "../utils/index.js";
import { fileUploadtoCloudianry } from "../utils/file.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation- not empty
    //already exists? check db(username,email)
    // need to upload images,avatar to multer and then cloudinary
    // create user object- in db
    // remove passowrd and refresh token from response
    // send response
    // success
    const { username, email, fullName, password } = req.body
    console.log(email)

    if (
        [fullName, username, email, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new Error('All fields are required')
    }
    const exiestedUser = User.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    })
    if (exiestedUser) {
        throw new Error(409, 'User already exists,Create new one')
    }
    const localpathavatar = req.files?.avatar[0]?.path
    const localImagepath = req.files?.coverImg[0]?.path

    if (!localpathavatar) {
        throw new Error(409, 'Avatar file is required')
    }
    const avatar = await fileUploadtoCloudianry(localpathavatar)
    const avatar2 = await fileUploadtoCloudianry(localImagepath)
    if (!avatar) {
        throw new Error(400, 'Error while uploading avatar')
    }
    const usre = await User.create({
        username: username.toLowerCase(),
        email,
        avatar: avatar?.url,
        coverImg: avatar2?.url ?? " ",
        fullName,
        password
    })
    const creaetdUser = await User.findById(usre._id).select('-password  -refreshToken')
    if (!creaetdUser) {
        throw new Error(500, 'Error while creating user')
    }
    return res.status(201).json({
        response: new ApiResponse(200, creaetdUser, 'User registered successfully')
    })
})
export { registerUser } 
