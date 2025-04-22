import { User } from "../models/userModel.js";
import { asyncHandler } from "../utils/index.js";
import { fileUploadtoCloudianry } from "../utils/file.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshToen = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessTAOKEN = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        const tokenizedUser = await user.save({
            validateBeforeSave: false
        })
        return { accessTAOKEN, refreshToken }
    } catch (error) {
        const customError = new Error('Error while generating tokens')
        customError.statusCode = 500
        throw customError
    }
}
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
    const exiestedUser = await User.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    })
    if (exiestedUser) {
        throw new Error(409, 'User already exists,Create new one')
    }
    const localFilePath = req.files?.avatar[0]?.path
    const localImagepath = req.files?.coverImg[0]?.path

    if (!localFilePath) {
        throw new Error(409, 'Avatar file is required')
    }
    const avatar = await fileUploadtoCloudianry(localFilePath)
    const avatar2 = await fileUploadtoCloudianry(localImagepath)
    if (!avatar) {
        const error = new Error('Error while uploading avatar')
        error.statusCode = 500;
        throw error
    }
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        avatar: avatar?.url,
        coverImg: avatar2?.url ?? " ",
        fullName,
        password
    })
    const createdUser = await User.findById(user._id).select('-password  -refreshToken')
    if (!createdUser) {
        throw new Error(500, 'Error while creating user')
    }
    return res.status(201).json({
        response: new ApiResponse(200, creaetdUser, 'User registered successfully')
    })
})
const loginUser = asyncHandler(async (req, res) => {
    //req body-get data
    //username || email
    // find the user
    // if not found-throw error
    // check password
    // tokens
    // send these tokens either in tokens
    const { username, email, password } = req.body
    if (!(username || email)) {
        const error = new Error('Username or email is required')
        error.statusCode = 400
        throw error
    }
    const findUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (!findUser) {
        const error = new Error('User does not exist')
        error.statusCode = 404
        throw error
    }
    const isPasswordValid = await findUser.isPasswordMtahced(password)
    if (!isPasswordValid) {
        const error = new Error('Password does not matched')
        error.statusCode = 400
        throw error
    }
    const { accessTAOKEN, refreshToken } = await generateAccessandRefreshToen(findUser._id)
    const logedinUser = await User.findById(findUser._id).select('-password -refreshToken')
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie('accessToken', accessTAOKEN, options)
        .cookie('refreshToken', refreshToken, options)
        .json({
            response: new ApiResponse(200, {
                user: logedinUser, accessTAOKEN, refreshToken
            }, 'User loggedin sucessfully')
        })
})
const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json({
            message: 'User logged Out'
        })
})
export {
    registerUser,
    loginUser,
    logoutUser
} 
