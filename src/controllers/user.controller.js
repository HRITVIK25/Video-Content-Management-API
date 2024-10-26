import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAcessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exist: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullname, email, username, password } = req.body; //req.body use karke extract kare saare data points
  // console.log("email: ", email);

  // if(fullname===""){
  //     throw new ApiError(400, "fullname is required")
  // } this way is good for beginners check each field

  // advance method:

  if (
    [fullname, email, username, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  } //checked ki koi field empty to nhi hai

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  }); // checked ki koi user exist to nhi karta same email or username sai

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  } //agar exist karta hai nto error dedo

  const avatarLocalPath = req.files?.avatar[0]?.path; //avatar ka local path nikala
  // const coverImageLocalPath =  req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  } // checked for coverimage kyonki yeh required field nhi hai

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar local file is required");
  } //agar local path nhi mili avatar ki to throw error

  //avatar and cover image ko cloudinary par upload karwaya
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar cloudinary file is required");
  } // again checked for avatat as it is a required field

  // created a new user using above field spellings ka dhyan rakhen
  const user = await User.create({
    fullname,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "", // because cover image is not neccesary so check if uploaded
    email,
    password,
    username: username.toLowerCase(),
  }); // yahan se keys dalti hai postman mai sahi spelling daalo

  // user ko create karo but password aur refreshtokens mat bhejo to wo nhi dikhte postman mai
  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens" // by default sab select hote hai - sign ke aage wo likho jo nhi chayiye
  );

  // agar user create karte hue kuch error aaye to uski condition
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // agar user succesfully create ho jaye to success status visible in postman using utils ApiResponse jo humne banaya tha
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Succesfully!"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // generate acces token
  // generate refresh tokens,
  // send cookies

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist please register");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password Incorrect!!");
  }

  const { accessToken, refreshToken } = await generateAcessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          //data field
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in succesfully!"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  //  take away access and refresh tokens
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshTokens: 1, // this removes field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unathorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshTokens) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAcessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("newrefreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newrefreshToken },
          "access token updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  if(oldPassword === newPassword){
    throw new ApiError(400, "old and new password cannot be same")
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id)

  if(!user){
    throw new ApiError(400, "user does not exist")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user , "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!(fullname || email)) {
    throw new ApiError(401, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshTokens");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    new ApiError(400, "Avatar file missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const deleteUserAvatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset:{
        avatar : 1
      }
    },
  )

  if(!deleteUserAvatar){
    throw new ApiError(400, "Old Avatar not deleted")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    new ApiError(400, "coverImage file missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading coverImage");
  }

  const deleteUsercoverImage = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset:{
        coverImage : 1
      }
    },
  )

  if(!deleteUsercoverImage){
    throw new ApiError(400, "old cover Image not deleted")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});


const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params; //params is basically url placeholder

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", // jo model ka naam diya hai wo jaise mongodb mai store hota hai waise likho
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      },
    },
    {
      $lookup: {
        from: "subscriptions", 
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers" //$ used because this is also a field
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo" //$ used because this is also a field
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount:  1,
        isSubscribed: 1,
        avatar: 1,
        coverImage:1,
        email:1
      }
    }
  ]);

  if(!channel?.length){
    throw new ApiError(400,"channel does not exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User channel fetched succesfully")
  )
});

const getWatchHistory =  asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: 'videos',
        localfields: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory, 
      "Watch History fetched succesfully"
    )
  )
})

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
