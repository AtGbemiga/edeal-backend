import { Router } from "express";
const router = Router();

import { payment } from "../controllers/paystack/paystack";
import { payStackWebhook } from "../controllers/paystack/webhook";
import { verify } from "../controllers/paystack/verify";
import { callback } from "../controllers/paystack/callback";
import { paymentContact } from "../controllers/paystack/paymentContact";
import { contactCallback } from "../controllers/paystack/callbackContact";
import { paymentPostDeal } from "../controllers/paystack/paymentPostDeal";
import { callbackPostDeal } from "../controllers/paystack/callBackPostDeal";

router.get("/payment", payment);
router.post("/paystack-webhook", payStackWebhook);
router.get("/verify", verify);
router.get("/callbackurl", callback);
router.get("/paymentContact", paymentContact);
router.get("/callbackurlcontact", contactCallback);
router.get("/paymentPostDeal", paymentPostDeal);
router.get("/postdealc", callbackPostDeal);

export default router;
