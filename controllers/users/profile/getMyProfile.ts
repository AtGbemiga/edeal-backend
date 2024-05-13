import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../../../db/db";
import getUserIDAndToken from "../getUserIdFromToken";

export const getMyProfile: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { id: acc_id } = getUserIDAndToken(req);
  if (!acc_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    pool.execute<RowDataPacket[]>(
      `
        SELECT id, img, account_name, phone_number, account_type, email, address, tag
FROM users
WHERE id = ?;
                `,
      [acc_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No results found" });
          return;
        }

        res.status(200).json({ result });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
