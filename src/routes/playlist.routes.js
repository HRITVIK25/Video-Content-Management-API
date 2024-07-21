import { Router } from "express";
import {
    addVideoToPlaylist,
  createPlaylist,
  getPlaylistById,
  getUserPlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/createPlaylist").post(createPlaylist);
router.route("/getPlaylist").get(getUserPlaylist);
router.route("/getPlaylistById/:id").get(getPlaylistById);
router.route("/addVideoToPlaylist/:playlistId/:videoId").get(addVideoToPlaylist);

export default router;
