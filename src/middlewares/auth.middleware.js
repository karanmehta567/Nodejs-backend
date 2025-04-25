import { User } from "../models/userModel.js";
import { asyncHandler } from "../utils/index.js";
import jwt from 'jsonwebtoken'

export const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log("token", token)
        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized access'
            })
        }
        //token is present now
        // verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log("decoded", decoded)
        const user = await User.findById(decoded._id).select('-password -refreshToken')
        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized access-Invalid Token'
            })
        }
        req.user = user
        next();
    } catch (error) {
        console.log("Error", error)
        return res.status(401).json({
            message: 'Invalid access'
        })
    }
})