import { Request, Response } from "express";
import * as http from "http";
import * as https from "https"; // Import https module

export const paymentPostDeal = (req: Request, res: Response): void => {
  const params = JSON.stringify({
    email: req.query.email,
    amount: req.query.amount,
    callback_url:
      "https://eager-hardly-gator.ngrok-free.app/api/v1/paystack/postdealc",
  });

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/transaction/initialize",
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_DEV_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  };

  const reqpaystack = https
    .request(options, (respaystack: http.IncomingMessage) => {
      let data = "";

      respaystack.on("data", (chunk) => {
        data += chunk;
      });

      respaystack.on("end", () => {
        res.send(data);
      });
    })
    .on("error", (error) => {
      console.error(error);
    });

  reqpaystack.write(params);
  reqpaystack.end();
};
