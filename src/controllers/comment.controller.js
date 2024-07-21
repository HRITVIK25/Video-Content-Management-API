import mongoose, { Mongoose } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, id:videoId } = req.params;

  if(!videoId){
    throw new ApiError(400, "Video not found")
  }

  try {
    const videoComments = await Comment.find({video: videoId})
                                       .limit(limit*1)
                                       .skip((page-1)*10)
                                       .sort({createdAt: -1})

    const countComments = await Comment.countDocuments({video: videoId});
    const totalpages = Math.ceil(countComments/limit)

    const comments = {
      videoComments: videoComments,
      pages: totalpages,
      currentPage: page
    }

    console.log(comments);
    return res 
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"))

  } catch (error) {
    throw new ApiError(500, `Error: ${error}`)
  }
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { id: videoId } = req.params;

  if (!content) {
    throw new ApiError(400, "Please enter content");
  }

  if (content.length > 300) {
    throw new ApiError(400, "Content should be less than 300 characters");
  }

  if (!videoId) {
    throw new ApiError(400, "Video not found");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { id: commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment not found");
  }

  if (!content) {
    throw new ApiError(400, "No content found to update");
  }

  if (content.length > 300) {
    throw new ApiError(400, "Content should be less than 300 characters");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id: commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment not found");
  }
  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(400, "Error deleting comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment Deleted Successfully"));
});

export { addComment, updateComment, deleteComment, getVideoComments };
