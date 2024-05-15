import { Request, Response } from "express";
import * as http from "http";
import * as https from "https"; // Import https module
import { RowDataPacket } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

/**
 * Process:
 * confirm if the sender and receiver ids are in the payment_contact table
 * If yes. Send success response to permit their communication
 * If no. Init payment
 */

// TODO: handle no user_id && no recipient_id && amount && email
export const paymentContact = (req: Request, res: Response): void => {
  const { id: user_id } = getUserIDAndToken(req);
  const params = JSON.stringify({
    email: req.query.email,
    amount: process.env.PAYMENT_CONTACT_PRICE,
    callback_url: "https://fav-work.loca.lt/api/v1/paystack/callbackurlcontact", // wrong
    metadata: {
      senderID: user_id,
      recipientID: req.query.recipientID,
    },
  });

  console.log(process.env.PAYMENT_CONTACT_PRICE);

  console.log(req.query.recipientID);

  try {
    pool.execute<RowDataPacket[]>(
      `
            SELECT id, payment_status
FROM payment_contact
WHERE fk_sender_id = ? AND fk_recipient_id = ?
            `,
      [user_id, req.query.recipientID],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
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
          return;
        } else {
          res.status(200).json({ message: "success" });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
