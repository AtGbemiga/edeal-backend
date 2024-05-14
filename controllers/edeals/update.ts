import express, { Request, Response } from "express";

import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const updateNotice: express.RequestHandler = (
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
    pool.execute<ResultSetHeader>(
      `
      UPDATE notice 
      SET changes = changes + 1
      WHERE fk_user_id = ?;
            `,
      [user_id],
      (err) => {
        if (err) {
          console.error("Error invalidating token:", err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else {
          res.status(200).json({ message: "Update saved successfully" });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
