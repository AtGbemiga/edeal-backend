import express, { Request, Response } from "express";

import { RowDataPacket } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const getDeal: express.RequestHandler = (
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

  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT id, need, price, tag FROM market ORDER BY id DESC LIMIT 10 OFFSET 0
            `,
      (err, result) => {
        if (err) {
          console.error("Error invalidating token:", err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No results found" });
          return;
        } else {
          res.status(200).json({ result });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
