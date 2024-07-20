import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/createTweet").post(createTweet);
router.route("/getTweet").get(getUserTweet);
router.route("/updateTweet/:id").patch(updateTweet);
router.route("/deleteTweet/:id").delete(deleteTweet);
router.route("/getTweets").get(getUserTweet);

export default router;
