import { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import { verify } from "./verify";

export const contactCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reference: referenceID } = req.query as { reference: string };
  console.log({ referenceID });

  verify({ referenceID })
    .then((response) => {
      console.log({ response });

      // if payment is successful
      if (response.data.status === "success") {
        // get the verify fn email, referenceID, and payment_status
        const { email } = response.data.customer;
        const { reference: referenceID } = response.data;
        const { status: payment_status } = response.data;
        const { senderID, recipientID } = response.data.metadata as {
          senderID: string;
          recipientID: string;
        };
        console.log({ email, referenceID, payment_status });

        pool.execute<ResultSetHeader>(
          `
                      INSERT INTO payment_contact
        (fk_user_email,
        payment_status,
        referenceID,
        fk_sender_id,
        fk_recipient_id)
        VALUES
        (?, ?, ?, ?, ?)
                      `,
          [email, payment_status, referenceID, senderID, recipientID],
          (err) => {
            if (err) {
              console.error(err);
              res.status(500).json({ error: "Internal server error" });
              return;
            }
            res.status(200).json({ message: "Payment successful" });
          }
        );
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Error occurred", error: error });
    });
};
