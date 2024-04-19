import { Router } from "express";
const router = Router();

import { createUser } from "../controllers/users/create";
import { login } from "../controllers/users/login";
import { getProfile } from "../controllers/users/profile/getProfile";
import { getMyProfile } from "../controllers/users/profile/getMyProfile";

router.route("/").post(createUser);
router.route("/login").post(login);
router.route("/profile/:acc_id").get(getProfile);
router.route("/myProfile").get(getMyProfile);

export default router;
