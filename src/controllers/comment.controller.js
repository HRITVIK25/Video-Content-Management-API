import { Mongoose } from "mongoose";
import jwt from "jsonwebtoken";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { id: videoId } = req.params;

  if (!content) {
    throw new ApiError(400, "Please enter content");
  }

  if (!videoId) {
    throw new ApiError(400, "Video not found");
  }

  const user = await User.findById(req.user?._id);

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

export { addComment };
