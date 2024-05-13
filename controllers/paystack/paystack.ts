import { Request, Response } from "express";
import * as https from "https"; // Import https module
import * as http from "http";
import { getCartPrice } from "../products/getCartPrice";

export const payment = (req: Request, res: Response): void => {
  const params = JSON.stringify({
    email: req.query.email,
    amount: req.query.amount,
    callback_url: "https://fav-work.loca.lt/api/v1/paystack/callbackurl",
  });

  getCartPrice(req).then((price) => {
    const frontendPrice = Number(req.query.amount) / 100;
    const backendPrice = Number(price) + 600;
    console.log({ backendPrice, frontendPrice });

    if (backendPrice !== frontendPrice) {
      res
        .status(400)
        .json({ error: "Cart price does not match with the database" });
      return;
    } else {
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
    }
  });
};
