import crypto from "crypto";
import { Request, Response } from "express";
const secret = process.env.PAYSTACK_DEV_SECRET_KEY;
// Using Express
export const payStackWebhook = (req: Request, res: Response) => {
  if (secret === undefined)
    return res.sendStatus(500).json("Paystack secret key not set");

  //validate event
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");
  if (hash == req.headers["x-paystack-signature"]) {
    // Retrieve the request's body
    const event = req.body;

    // Handle the event
    switch (event.event) {
      case "charge.success":
        res.send(200).json({ message: "success" });
    }
  }
  res.send(200);
};
