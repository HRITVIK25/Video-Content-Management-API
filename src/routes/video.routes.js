import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getVideoById,
  getVideoByTitle,
  publishAVideo,
  updateVideoThumbnail,
} from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/uploadVideo").post(
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

// Secure Routes
router.route("/findVideoByTitle").get(getVideoByTitle);
router.route("/getVideoById/:id").get(getVideoById);
router
  .route("/updateThumbnail/:id")
  .patch(upload.single("thumbnail"), updateVideoThumbnail);

export default router;
