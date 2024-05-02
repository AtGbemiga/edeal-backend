import { Request, Response } from "express";
import getUserIDAndToken from "../users/getUserIdFromToken";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getAccOwnerEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  } else {
    pool.execute<RowDataPacket[]>(
      `
                SELECT email FROM users WHERE id = ?;`,
      [user_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(200).json({ result: result[0] });
      }
    );
  }
};
