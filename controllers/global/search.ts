import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../../db/db";

export const search: express.RequestHandler = (req: Request, res: Response) => {
  const { identifier, searchValue } = req.query;
  console.log({ identifier, searchValue });

  if (!identifier || !searchValue) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    if (identifier === "products" && searchValue) {
      pool.execute<RowDataPacket[]>(
        `
        SELECT q.id, q.name, SUBSTRING_INDEX(GROUP_CONCAT(q1.imgs), ',', 1) AS first_img, COALESCE(ROUND(AVG(q2.rating), 1), 0) AS rating, COUNT(DISTINCT q2.fk_user_id) AS ratings_count, q3.id AS store_id, q3.img, q3.account_name, q3.verified, 'searchRes' 
        FROM products q
        LEFT JOIN product_imgs q1 
        ON q1.fk_product_id = q.id
        LEFT JOIN product_star_ratings q2
        ON q2.fk_product_id = q.id
        LEFT JOIN users q3 ON q.fk_user_id = q3.id
        GROUP BY q.id , q.name, q.sub_heading, q.description, q.category, q.price, q.stock_no, q.status, q.created_at
        HAVING q.name LIKE ?;
                `,
        [`%${searchValue}%`],
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
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
