import { Mongoose } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId: videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Video not found")
    }

    const toggleButton = await Video.aggregate([
        {
            $match: {
                _id: videoId
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id"
            }
        }
    ])
})

export {};
