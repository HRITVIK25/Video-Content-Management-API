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

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video.url) {
    throw new ApiError(401, "cloudinary video url is required");
  }

  if (!thumbnail.url) {
    throw new ApiError(401, "cloudinary thumbnail url is required");
  }

  const createdVideo = await Video.create({
    videoFile: video?.url,
    duration: video?.duration,
    thumbnail: thumbnail?.url,
    title,
    description,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "New video uploaded succesfully"));
});

const getVideoByTitle = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) {
    throw new ApiError(400, "Please provide title for the video");
  }

  const video = await Video.find({ title });

  let videoIds = [];

  if (Array.isArray(video)) {
    for (let i = 0; i < video.length; i++) {
      let videoId = video[i]._id;
      videoIds.push(videoId);
    }
  } else {
    const videoId = video._id;
    videoIds.push(videoId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoIds, "Video fetched succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { id: videoId } = req.params;

  return res
    .status(200)
    .json(new ApiResponse(200, videoId, "videoID fetched successfully"));
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const { id: videoId } = req.params;

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file not found");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError(400, "thumbnail cloudinary url not found");
  }

  const deleteThumbnail = await Video.findByIdAndUpdate(videoId, {
    $unset: {
      thumbnail: 1,
    },
  });

  if (!deleteThumbnail) {
    throw new ApiError(400, "old thumbnail not deleted");
  }

  const updatedThumbnail = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  return res
  .status(200)
  .json(new ApiResponse(200, updatedThumbnail, "Thumbnail updated successfully"))
});

export { publishAVideo, getVideoByTitle, getVideoById, updateVideoThumbnail };
