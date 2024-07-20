import { Mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthCheck = asyncHandler(async (req, res) => {
  try {
    const data = {
      uptime: process.uptime(),
      message: "Ok",
      date: new Date(),
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          data,
          `All conncetions made succesfully on port ${process.env.PORT}`
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, `ERROR: ${error}`);
  }
});

export { healthCheck };
