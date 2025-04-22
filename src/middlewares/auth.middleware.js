import { User } from "../models/userModel";
import { asyncHandler } from "../utils";
import jwt from 'jsonwebtoken'

export const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized access'
            })
        }
        //token is present now
        // verify the token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN)

        const user = await User.findById(decoded._id).select('-password -refreshToken')
        if (!user) {
            return res.sttaus(401).json({
                message: 'Unauthorized access-Invalid Token'
            })
        }
        req.user = user
        next();
    } catch (error) {
        return res.status(404).json({
            message: 'Invalid access'
        })
    }
})