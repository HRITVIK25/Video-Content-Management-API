import { Router } from "express";
import {
  addComment,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.use(verifyJWT);

router.route("/addComment/:id").post(addComment);
router.route("/updateComment/:id").patch(updateComment);

export default router;