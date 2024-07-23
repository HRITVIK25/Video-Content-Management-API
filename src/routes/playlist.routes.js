import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/createPlaylist").post(createPlaylist);
router.route("/getPlaylist").get(getUserPlaylist);
router.route("/getPlaylistById/:id").get(getPlaylistById);
router
  .route("/addVideoToPlaylist/:playlistId/:videoId")
  .get(addVideoToPlaylist);
router.route("/deletePlaylist/:playlistId").delete(deletePlaylist);
router.route("/updatePlaylist/:playlistId").patch(updatePlaylist);
router.route("/removeVideoFromPlaylist/:playlistId/:videoId").patch(removeVideoFromPlaylist);

export default router;
