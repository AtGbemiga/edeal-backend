import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const addToCart: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const {
    product_id,
    qty,
    personalized_price,
    colour,
    size,
  }: {
    product_id: string;
    qty: string;
    personalized_price: string;
    colour: string;
    size: string;
  } = req.body;
  const { id: user_id } = getUserIDAndToken(req);

  if (
    !product_id ||
    !user_id ||
    !qty ||
    !personalized_price ||
    !colour ||
    !size
  ) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    pool.execute<ResultSetHeader>(
      `
INSERT INTO cart (fk_user_id, fk_product_id, qty, personalized_price, colour, size) VALUES (?, ?, ?, ?, ?, ?);
`,
      [user_id, product_id, qty, personalized_price, colour, size],
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }

        res.status(200).json({ message: "Product added to cart successfully" });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
