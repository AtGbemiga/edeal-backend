import { Router } from "express";
import { addDeal } from "../controllers/edeals/add";
import { getDeal } from "../controllers/edeals/get";
import { noticeByUserTag } from "../controllers/edeals/noticeByUserTag";
import { updateNotice } from "../controllers/edeals/update";

const router = Router();

router.route("/add").post(addDeal);
router.route("/get").get(getDeal);
router.route("/noticeByUserTag").get(noticeByUserTag);
router.route("/updateNotice").patch(updateNotice);

export default router;
