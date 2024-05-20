import { Router } from "express";
import { uploadNews } from "../controllers/news/upload";
import { getAllNews } from "../controllers/news/get";
const router = Router();

router.route("/upload").post(uploadNews);
router.route("/getAll/:id").get(getAllNews);

export default router;
