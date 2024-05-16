import { Router } from "express";
const router = Router();

import { createUser } from "../controllers/users/create";
import { login } from "../controllers/users/login";
import { getProfile } from "../controllers/users/profile/getProfile";
import { getMyProfile } from "../controllers/users/profile/getMyProfile";
import { updateProfile } from "../controllers/users/profile/update";
import { logout } from "../controllers/users/logout";
import { changePassword } from "../controllers/users/changePassword";
import { getUserId } from "../websocket/getUserId";

router.route("/").post(createUser);
router.route("/login").post(login);
router.route("/profile/:acc_id").get(getProfile);
router.route("/myProfile").get(getMyProfile);
router.route("/updateProfile").patch(updateProfile);
router.get("/logout", logout);
router.post("/change-password", changePassword);
router.route("/getUserId").get(getUserId);

export default router;
