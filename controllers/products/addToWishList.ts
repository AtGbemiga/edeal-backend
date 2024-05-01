import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const addToWishList: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { productID }: { productID: string } = req.body;
  const { id: user_id } = getUserIDAndToken(req);
  console.log({ productID, user_id });

  if (!productID || !user_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    pool.execute<ResultSetHeader>(
      `
      INSERT INTO product_wishlist
      (fk_product_id,
      fk_user_id)
      VALUES
      (?,
      ?);
`,
      [productID, user_id],
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }

        res
          .status(200)
          .json({ message: "Product added to wish list successfully" });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
