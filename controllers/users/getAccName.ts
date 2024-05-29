import { Request, Response } from "express";
import getUserIDAndToken from "./getUserIdFromToken";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getAccName = (req: Request, res: Response) => {
  const { id: user_id } = getUserIDAndToken(req);

  try {
    pool.execute<RowDataPacket[]>(
      `SELECT account_name FROM users WHERE id = ?;`,
      [user_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        console.log(result);
        console.log(result[0]);

        res.status(200).json({ result });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
