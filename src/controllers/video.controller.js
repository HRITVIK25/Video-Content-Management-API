import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((fields) => fields?.trim() === "")) {
    throw new ApiError(400, "All fileds are required");
  }

  const videoLocalPath = req.files?.video[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  console.log(video);

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video) {
    throw new ApiError(401, "cloudinary video file is required");
  }

  if (!thumbnail) {
    throw new ApiError(401, "cloudinary thumbnail file is required");
  }

  const createdVideo = await Video.create({
    videoFile: video.url,
    duration: video.duration,
    thumbnail: thumbnail.url,
    title,
    description,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "New video created succesfully"));
});

export { publishAVideo };
