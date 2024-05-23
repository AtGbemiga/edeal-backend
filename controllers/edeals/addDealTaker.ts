import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../../db/db";

type ReqQuery = {
  fk_deal_id: number;
};

type ReqBody = {
  deal_taker_email: string;
};

export const addDealTaker = (req: Request, res: Response) => {
  const { fk_deal_id } = req.query as unknown as ReqQuery;
  const { deal_taker_email }: ReqBody = req.body;

  console.log({ fk_deal_id, deal_taker_email });

  if (!fk_deal_id || !deal_taker_email) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      connection.beginTransaction((err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }

        connection.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE email = ?;`,
          [deal_taker_email],
          (err, result) => {
            if (err) {
              console.error(err);
              res.status(500).json({ error: "Internal server error" });
              return;
            }

            if (result.length === 0) {
              res.status(404).json({ error: "User not found" });
              return;
            }

            const user_id = result[0].id;

            connection.query<ResultSetHeader>(
              `
                          INSERT INTO deal_taker
(fk_deal_id,
fk_deal_taker_id)
VALUES
(?, ?);
                          `,
              [fk_deal_id, user_id],
              (err) => {
                if (err) {
                  console.error(err);
                  connection.rollback(() => {
                    console.error(err);
                    res.status(500).json({ error: "Internal server error" });
                  });
                  return;
                }

                connection.commit((err) => {
                  if (err) {
                    console.error(err);
                    res.status(500).json({ error: "Internal server error" });
                    return;
                  }

                  res.status(200).json({ message: "Saved successfully" });
                });
              }
            );
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
