import { Router } from "express";
const router = Router();

import { payment } from "../controllers/paystack/paystack";
import { payStackWebhook } from "../controllers/paystack/webhook";
import { verify } from "../controllers/paystack/verify";
import { callback } from "../controllers/paystack/callback";
import { paymentContact } from "../controllers/paystack/paymentContact";

router.get("/payment", payment);
router.post("/paystack-webhook", payStackWebhook);
router.get("/verify", verify);
router.get("/callbackurl", callback);
router.get("/paymentContact", paymentContact);

export default router;
