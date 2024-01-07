import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    // check access token by web or mobile app/API call
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Unauthorized request.");
        }
        //JWT token verify
        const decodedToken = await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id).select(
            "-password, -refreshToken"
        );
        if (!user) {
            throw new ApiError(401, "Invalid access token.");
        }
        // after verify jwt token  assign user to req
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid access token.");
    }
});
