import { Router } from "express";
const router = Router();

import { uploadShortVideo } from "../controllers/shortVideos/upload";
import { getAllInfo } from "../controllers/shortVideos/getAllInfo";

// import { addComment } from "../../controllers/shortVideos/addComment";
// import { addLike } from "../../controllers/shortVideos/addLike";
// import { unLike } from "../../controllers/shortVideos/unLike";
// import { increaseView } from "../../controllers/shortVideos/addViews";

router.post("/", uploadShortVideo);
router.get("/getAllInfo", getAllInfo);
// router.post("/addComment", addComment);
// router.post("/addLike", addLike);
// router.post("/unLike", unLike);
// router.post("/increaseView", increaseView);

export default router;
