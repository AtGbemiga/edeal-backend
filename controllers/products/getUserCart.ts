import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const getCart: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const finalResult: RowDataPacket[][] = [];

    pool.execute<RowDataPacket[]>(
      `
        SELECT q.id, q1.name, q1.price, SUBSTRING_INDEX(GROUP_CONCAT(q3.imgs), ',', 1) AS first_img, q4.account_name AS store_name, q.qty
        FROM cart q
        LEFT JOIN products q1 ON q.fk_product_id = q1.id
        LEFT JOIN users q2 ON q.fk_user_id = q2.id
        LEFT JOIN product_imgs q3 ON q3.fk_product_id = q1.id
        LEFT JOIN users q4 ON q4.id = q1.fk_user_id
        WHERE q2.id = ?
        GROUP BY q.id, store_name;
`,
      [user_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        if (result.length === 0) {
          res.status(404).json({ error: "No cart items yet" });
          return;
        }

        finalResult.push(result);

        pool.execute<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM cart WHERE fk_user_id = ?;",
          [user_id],
          (err, result) => {
            if (err) {
              console.error(err);
            }
            if (result.length === 0) {
              res.status(404).json({ error: "No reviews yet" });
            }

            finalResult.push(result);

            res.status(200).json({ finalResult });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
