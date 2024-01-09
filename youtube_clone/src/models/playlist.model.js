import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
        },
        videos: [{
            type: Schema.Types.ObjectId,
            ref: "Video",
        }],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
       
    },
    { timestamps: true }
);

//plugin inject for aggregate query
playlistSchema.plugin(mongooseAggregatePaginate);
export const Playlist = mongoose.model("Playlist", playlistSchema);
