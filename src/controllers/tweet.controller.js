import { Mongoose } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  if (content.length > 300) {
    throw new ApiError(400, "Only 300 characters allowed");
  }

  const user = await User?.findById(req.user?._id);

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: user?._id,
  });

  if (!tweet) {
    throw new ApiError(400, "Error in creating a tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const userId = user?._id;

  const tweet = await User.aggregate([
    {
      $match: {
        _id: userId,
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "Tweets",
      },
    },
    // {
    //   $addFields: {
    //     Tweets: {
    //       $size: "$Tweets",
    //     },
    //   },
    // },
    {
      $unwind: {
        path: "$Tweets"
      }
    },
    {
      $project: {
        _id: "$Tweets._id",
        content: "$Tweets.content",
        createdAt : "$Tweets.createdAt",
        user: {
          _id : 1,
          fullname: 1,
          username: 1
        }
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "User tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { id: tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet not found");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "No content found to update");
  }

  if (content?.length > 300) {
    throw new ApiError(400, "Maximum 300 characters allowed");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated succesfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { id: tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet not found");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(400, "Error in deleting the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweet, updateTweet, deleteTweet };
