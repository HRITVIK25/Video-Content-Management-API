import { Router } from "express";
import {
  addComment,
  deleteComment,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.use(verifyJWT);

router.route("/addComment/:id").post(addComment);
router.route("/updateComment/:id").patch(updateComment);
router.route("/deleteComment/:id").delete(deleteComment);

export default router;
