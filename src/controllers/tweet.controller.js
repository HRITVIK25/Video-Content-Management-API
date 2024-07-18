import { Mongoose } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    if(content.length>300){
        throw new ApiError(400, "Only 300 characters allowed")
    }

    const user = await User?.findById(req.user?._id);

    if(!user){
        throw new ApiError(400, "user not found")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: user?._id
    })

    if(!tweet){
        throw new ApiError(400, "Error in creating a tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"))
});

export {
    createTweet
};
