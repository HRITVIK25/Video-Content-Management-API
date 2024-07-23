import { Mongoose } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!(name && description)) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req?.user._id);
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created succesfully"));
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const user = await User.findById(req?.user._id);
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  const userId = user?._id;

  const UserPlaylist = await Playlist.find({ owner: userId });

  if (!UserPlaylist) {
    throw new ApiError(400, "No user playlist found`");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, UserPlaylist, "Playlist fetched succesfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { id: playlistId } = req.params;
  console.log(playlistId);

  if (!playlistId) {
    throw new ApiError(400, "Playlist ID not found");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Error retrieving playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched succedsfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId: playlistId, videoId: videoId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "Playlist not found");
  }

  if (!videoId) {
    throw new ApiError(400, "video not found");
  }

  const video = await Video.findById(videoId);
  console.log(video);

  try {
    const playlist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        // why is this pushing only id of videos
        $push: {
          videos: video,
        },
      },
      { new: true }
    );
    console.log(playlist);
    return res
      .status(200)
      .json(
        new ApiResponse(400, playlist, "Video added to playlist successfully")
      );
  } catch (error) {
    throw new ApiError(400, `ERROR: ${error}`);
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId: playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist not found");
  }

  try {
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully")
      );
  } catch (error) {
    throw new ApiError(400, `ERROR: ${error}`);
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId: playlistId } = req.params;
  const { name, description } = req.body;

  if (!(name || description)) {
    throw new ApiError(400, "Atleast one field is required");
  }

  if (name.trim() === "" || description.trim() === "") {
    throw new ApiError(400, "Name or description cannot be empty");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Error updating the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  deletePlaylist,
  updatePlaylist,
};
