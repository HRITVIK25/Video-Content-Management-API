import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getVideoById,
  getVideoByTitle,
  publishAVideo,
  updateVideoDetails,
  updateVideoThumbnail,
  videoDelete,
  togglePublishStatus,
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

router.route("/findVideoByTitle").get(getVideoByTitle);
router.route("/getVideoById/:id").get(getVideoById);
router
  .route("/updateThumbnail/:id")
  .patch(upload.single("thumbnail"), updateVideoThumbnail);

router.route("/UpdateVideoDetails/:id").patch(updateVideoDetails);
router.route("/DeleteVideo/:id").delete(videoDelete);
router.route("/togglePublishButton/:id").patch(togglePublishStatus);

export default router;
