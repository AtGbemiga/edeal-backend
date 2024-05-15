import { Request, Response } from "express";
import { verify } from "./verify";
import pool from "../../db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

/**
 * Aim: Verify payment, save the order to database then send response
 * Process:
 * // if payment is successful
 * get the verify fn email, referenceID, and payment_status
 * get all the associated products in the cart table
 * save the verify fn email, referenceID, and payment_status along with the associated products in orders table
 * // if payment is not successful
 * send error response
 */
interface Products {
  id: number;
  qty: number;
  personalized_price: number;
  colour: string;
  size: string;
  fk_product_id: number;
}
export const callback = async (req: Request, res: Response): Promise<void> => {
  const { reference: referenceID } = req.query as { reference: string };
  console.log({ referenceID });

  verify({ referenceID })
    .then((response) => {
      // if payment is successful
      if (response.data.status === "success") {
        // get the verify fn email, referenceID, and payment_status
        const { email } = response.data.customer;
        const { reference: referenceID } = response.data;
        const { status: payment_status } = response.data;
        console.log({ email, referenceID, payment_status });

        try {
          pool.getConnection((err, connection) => {});
        } catch (error) {
          res.status(500).json({ message: "Error occurred", error: error });
        }
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Error occurred", error: error });
    });
};
