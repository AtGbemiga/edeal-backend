import { Router } from "express";
const router = Router();

import { payment } from "../controllers/paystack/paystack";
import { payStackWebhook } from "../controllers/paystack/webhook";
import { verify } from "../controllers/paystack/verify";
import { callback } from "../controllers/paystack/callback";

router.get("/payment", payment);
router.post("/paystack-webhook", payStackWebhook);
router.get("/verify", verify);
router.get("/callbackurl", callback);

export default router;
