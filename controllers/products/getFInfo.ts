import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getProductFullInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { product_id } = req.params;

  if (!product_id) {
    res.status(400).json({ error: "Missing product_id" });
    return;
  }

  try {
    // check if the event exists in the database. Avoid race condition

    pool.execute<RowDataPacket[]>(
      `
      SELECT q.id, q.name, q.sub_heading, q.price, JSON_ARRAYAGG(q1.imgs) AS imgs, 
COALESCE(ROUND(AVG(q2.rating), 1), 0) AS rating, COUNT(DISTINCT q2.fk_user_id) AS ratings_count, 
(q.price * 0.5) AS discount, q.description, q.category,
(SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
      "sizes_id", q3.id,
        "xs", q3.xs,
        "s", q3.s,
        "m", q3.m,
        "l", q3.l,
        "xl", q3.xl,
        "xxl", q3.xxl,
        "x3l", q3.x3l 
      ) 
    ) FROM product_sizes q3 
	  WHERE q3.fk_product_id = q.id 
)AS sizes,
(SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
      "colors_id", q4.id,
        "blue", q4.blue,
        "red", q4.red,
        "yellow", q4.yellow,
        "green", q4.green,
        "brown", q4.brown,
        "orange", q4.orange,
        "white", q4.white,
        "black", q4.black,
        "purple", q4.purple
      ) 
    ) FROM product_colours q4 
	  WHERE q4.fk_product_id = q.id 
)AS colors
FROM products q
LEFT JOIN product_imgs q1 ON q1.fk_product_id = q.id
LEFT JOIN product_star_ratings q2 ON q2.fk_product_id = q.id
LEFT JOIN product_sizes q3 ON q3.fk_product_id = q.id
WHERE q.id = ?
GROUP BY q.id , q.name, q.sub_heading, q.description, q.category, q.price, q.stock_no, q.status, q.created_at;
      
                  `,
      [product_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Product not found" });
          return;
        } else {
          res.status(200).json({ result });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
