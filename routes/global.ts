import { Router } from "express";
const router = Router();

import { getLInfo } from "../controllers/global/getLInfo";
import { getReviews } from "../controllers/global/getReviews";
import { search } from "../controllers/global/search";

router.route("/getLInfo").get(getLInfo);
router.route("/getReviews").get(getReviews);
router.route("/search").get(search);

export default router;
