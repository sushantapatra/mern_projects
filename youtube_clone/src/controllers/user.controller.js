import Jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinaryFileupload.js";
//common method
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // mongoose validation false(not check validation)
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};
const registerUser = asyncHandler(async (req, res) => {
    /*  Steps 
	1.Get user details from frontend
	2.validation - not empty
	3.check if user already exists : username, email
	4.check for images, check for avatar
	5.upload them to cloudinary
	6.create user object- create entry in db
	7.remove passeord and refresh token field from response
	8.check for user creation
	9.return response */

    //Get user details from frontend
    const { userName, email, fullName, password } = req.body;
    //validation - not empty
    if (
        [userName, email, fullName, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required.");
    }
    //check if user already exists : username, email
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }],
    });
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists.");
    }

    //check for images, check for avatar
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let avatarLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required.");
    }

    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(404, "Avatar file is required.");
    }
    //console.log(avatar);
    //create user object- create entry in db
    const user = await User.create({
        userName,
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });
    //remove passeord and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    //check for user creation
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering a user."
        );
    }
    //return response
    return res
        .status(200)
        .json(
            new ApiResponse(201, createdUser, "User registered successfully.")
        );
});
const loginUser = asyncHandler(async (req, res) => {
    /*  Steps 
	1.Req body -> data [Get user details from frontend]
	2.username or email [validation - not empty]
	3.find the user
	4.password check 
	5.access and refresh token
	6.send cookie
	*/
    //getting Req body
    const { email, username, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "username or email  is required");
    }
    //find the user
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        throw new ApiError(404, "User does not exists.");
    }
    //password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials.");
    }
    //access and refresh token - and save data

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    //set cookies
    const loggedInUser = await User.findById(user._id).select("-password, -refreshToken"); //"-password, -refreshToken" -> un select
    //cookies only modified by server only
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    /** Step
     * Cookie clear
     * refreshToken value set null in databse
     */
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true, // return a new updated user data
        }
    );

    //cookies only modified by server only
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    //getting refresh token by cookies (Web) or body (Mobile)
    const incommingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized request.");
    }
    try {
        const decodedToken = Jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        console.log(decodedToken);
        //get user details
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token.");
        }
        //check refresh token and user refresh token
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or user.");
        }
        // Generate New Access token
        const { accessToken, newRefreshToken } =await generateAccessAndRefreshTokens(user._id);
        //cookies only modified by server only
        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(500, error?.message || "Invalid refresh token");
    }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
    /** Step
     * get old password, new password
     * old password value check in databse
     */
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect =await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old password");
    }
    user.password =newPassword
    await user.save({validateBeforeSave:false})
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully."));
});
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully.")); 
})
const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully.")); 
})
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath= req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }
    const avatar =await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}// new parameter provide a new updated user response
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully.")); 
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath= req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing");
    }
    const coverImage =await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true} // new parameter provide a new updated user response
    ).select("-password")
 
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully.")); 
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const  {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing.");
    }
    //get user data using aggrate
    const channel =await User.aggregate([
        {
            $match:{ // where
                userName:username?.toLowerCase()
            }
        },
        {
            $lookup:{ // join query
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscribers",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers" // it is a field (use $ sysmbol)
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"// it is a field (use $ sysmbol)
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    console.log(channel);
    if(!channel?.length){
        throw new ApiError(400, "Channel does not exists.");
    }
    
    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfully.")); 
})


const getWatchHistory= asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{ // join query
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        userName:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        } 
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
        
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully.")); 
})


export { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage };

