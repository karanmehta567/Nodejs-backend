import { User } from "../models/userModel.js";
import { asyncHandler } from "../utils/index.js";
import { fileUploadtoCloudianry } from "../utils/file.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
const generateAccessandRefreshToen = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        console.log('acess Token', accessToken)
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        const tokenizedUser = await user.save({
            validateBeforeSave: false
        })
        return { accessToken, refreshToken }
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
        response: new ApiResponse(200, createdUser, 'User registered successfully')
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
    const { accessToken, refreshToken } = await generateAccessandRefreshToen(findUser._id)
    const logedinUser = await User.findById(findUser._id).select('-password -refreshToken')
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json({
            response: new ApiResponse(200, {
                user: logedinUser, accessToken, refreshToken
            }, 'User loggedin sucessfully')
        })
})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
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
const generateRefreshAcessToken = asyncHandler(async (req, res) => {
    const incomingRefresh = req.cookies?.refreshToken || req.body?.refreshToken
    if (!incomingRefresh) {
        return res.status(401).json({
            message: 'Unauthorized access'
        })
    }
    try {
        const decodedtoken = jwt.verify(incomingRefresh, process.env.REFRESH_TOKEN)
        const user = await User.findById(decodedtoken._id)
        if (!user) {
            return res.status(401).json({
                message: 'Invalid refresh token'
            })
        }
        if (incomingRefresh !== user.refreshToken) {
            return res.status(401).json({
                message: 'Invalid token or Refresh token expired'
            })
        }
        const { accessToken, newRefreshToken } = await generateAccessandRefreshToen(user._id)
        const options = {
            httpOnly: true,
            secure: true
        }
        return res.status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json({
                response: new ApiResponse(200, {
                    accessToken, newRefreshToken
                }, 'Tokens generated succesfully')
            })
    } catch (error) {
        // console.log('error while generating refresh token')
        return res.status(401).json({
            message: 'Invalid refresh token'
        })
    }
})
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    //get some help from middleware, req.user if the user is loggedin only then he will be able to change password so simply
    const findUser = await User.findById(req.user._id)
    const isPasswordCorrect = await findUser.isPasswordMtahced(oldPassword)
    if (!isPasswordCorrect) {
        return res.status(401).json({
            message: 'Password does not matched'
        })
    }
    findUser.password = newPassword
    await findUser.save({
        validateBeforeSave: false
    })
    return res.status(200).json({
        response: new ApiResponse(200, {}, 'Password changed succesfully')
    })
})
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, 'Current user fetched succesfully')
})
const updateThedamnUser = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!(fullName || email)) {
        return res.status(400).json({
            message: 'provide me the fields to update'
        })
    }
    //same setup
    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            fullName,
            email
        }
    }, { new: true }).select('-password -refreshToken')
    return res.status(200).json({
        response: new ApiResponse(200, user, 'User updated succesfully')
    })
})
const updatetheDamnAVatar = asyncHandler(async (req, res) => {
    const avatarlocalpath = req.file?.path
    if (!avatarlocalpath) {
        return res.status(401).json({
            message: 'Avatar file is required'
        })
    }
    const fileUpload = await fileUploadtoCloudianry(avatarlocalpath)
    if (!fileUpload) {
        return res.status(400).json({
            message: 'Error while uplaoding avatar'
        })
    }
    const avataruploadtodb = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                avatar: fileUpload?.url
            }
        },
        { new: true }
    ).select('-password -refreshToken')
    return res.status(200).json({
        response: new ApiResponse(200, avataruploadtodb, 'avatar updated succesfully')
    })
})

export {
    registerUser,
    loginUser,
    logoutUser,
    generateRefreshAcessToken,
    changePassword,
    getCurrentUser,
    updateThedamnUser,
    updatetheDamnAVatar
} 
