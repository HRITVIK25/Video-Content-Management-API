import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
    avatar: avatar.url,
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
      $set: {
        refreshTokens: undefined,
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
      .cookies("accessToken", accessToken, options)
      .cookies("newrefreshToken", newrefreshToken, options)
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

export { registerUser, loginUser, logOutUser, refreshAccessToken };
