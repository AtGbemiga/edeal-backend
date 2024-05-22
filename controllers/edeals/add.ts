import express, { Request, Response } from "express";

import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

type ReqBody = {
  need: string;
  price: string;
  lg: string;
  state: string;
  tag:
    | "User"
    | "MakeupArtist"
    | "Repairer"
    | "Electrician"
    | "Plumber"
    | "Hairdresser"
    | "CarMechanic"
    | "Products";
};

export const addDeal: express.RequestHandler = (
  req: Request,
  res: Response
): void => {
  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res
      .status(401)
      .json({ message: "Unauthorized. Please login to continue." });
    return;
  }

  const { need, price, tag, lg, state }: ReqBody = req.body;

  if (!need || !price || !tag || !lg || !state) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    pool.execute<ResultSetHeader>(
      `
            INSERT INTO market
(need,
price,
tag,
fk_user_id,
lg,
state)
VALUES
(?,
?,
?,
?,
?,
?);
            `,
      [need, price, tag, user_id, lg, state],
      (err) => {
        if (err) {
          console.error("Error invalidating token:", err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }

        res.status(200).json({ message: "Deal added successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
