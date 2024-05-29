import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

// TODO: type check to ensure each parameter is of the correct type so the query doesn't get the right amount of params but still fail cos of the wrong type
export const getReviews: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { product_id, identifier, acc_id } = req.query;

  if (!product_id && !identifier) {
    res.status(400).json({ error: "Missing service provider id" });
    return;
  }

  if (identifier === "products" && product_id && !acc_id) {
    try {
      const finalResult: RowDataPacket[][] = [];

      pool.execute<RowDataPacket[]>(
        `
      SELECT rv.id, rv.review, u.account_name AS reviewer_name, u.img AS reviewer_img
FROM product_written_reviews rv
JOIN users u ON u.id = rv.fk_user_id
WHERE rv.fk_product_id = ?;
`,
        [product_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          }
          if (result.length === 0) {
            res.status(404).json({ error: "No reviews yet" });
            return;
          }

          finalResult.push(result);

          pool.execute<RowDataPacket[]>(
            "SELECT COUNT(*) AS total FROM product_written_reviews WHERE fk_product_id = ?;",
            [product_id],
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
  } else if (identifier === "sellerProfile" && !product_id && acc_id) {
    const finalResult: RowDataPacket[][] = [];
    pool.execute<RowDataPacket[]>(
      `
      SELECT q.id, q.review, q1.img AS reviewer_img, q1.account_name AS reviewer_name
FROM seller_acc_written_reviews q
LEFT JOIN users q1 ON q.fk_reviewer_user_id = q1.id
WHERE q.fk_seller_user_id = ?;
              `,
      [acc_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No reviews found" });
          return;
        }
        finalResult.push(result);

        pool.execute<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM seller_acc_written_reviews WHERE fk_seller_user_id = ?;",
          [acc_id],
          (err, result) => {
            if (err) {
              console.error(err);
              res.status(500).json({ error: "Internal server error" });
              return;
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
  } else {
    res.status(400).json({ error: "Invalid identifier" });
  }
};
