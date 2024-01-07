import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, "Fullname is required"],
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //Cloudnary url
            required: [true, "Avatar is required"],
        },
        coverImage: {
            type: String, //Cloudnary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

//mongoose Middleware (pre)  for password hashing
userSchema.pre("save", async function (next) {
    // check password filed modified or not
    if (!this.isModified("password")) return next();
    // accessing password to hashing
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// mongoose custom method defined for compare password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};
// mongoose custom method defined for JWT access token
userSchema.methods.generateAccessToken = async function () {
    return await jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
// mongoose custom method defined for JWT refresh token
userSchema.methods.generateRefreshToken = async function () {
    return await jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
