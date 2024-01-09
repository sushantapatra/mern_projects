import mongoose, { Schema } from "mongoose";
const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, "Content  is required"],
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
       
    },
    { timestamps: true }
);

//plugin inject for aggregate query
// tweetSchema.plugin(mongooseAggregatePaginate);
export const Tweet = mongoose.model("Tweet", tweetSchema);
