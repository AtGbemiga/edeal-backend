import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../../db/db";

type IdentifierType = "products" | "groups" | "services";

export const search: express.RequestHandler = (req: Request, res: Response) => {
  const { identifier, searchValue } = req.query as {
    identifier: IdentifierType;
    searchValue: string;
  };

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
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No results found" });
            return;
          }
          res.status(200).json({ productSearchData: result });
        }
      );
    } else if (identifier === "groups" && searchValue) {
      const finalResult: RowDataPacket[][] = [];

      pool.execute<RowDataPacket[]>(
        `
        SELECT 
          q.id,
          q.name,
          q.about,
          q.logo,
          q.fk_user_id,
          COUNT(DISTINCT q1.fk_user_id) AS member_total,
          COUNT(DISTINCT CASE WHEN q2.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN q2.id END) AS total_post_last_24_hrs
      FROM 
          egroups q
      LEFT JOIN 
          egroup_members q1 ON q1.fk_group_id = q.id
      LEFT JOIN 
          egroup_posts q2 ON q2.fk_group_id = q.id
      WHERE q.name LIKE ?
      GROUP BY 
          q.id;
`,
        [`%${searchValue}%`],
        (err, result) => {
          if (err) {
            res.status(500).json({ error: "Internal server error" });
            return;
          }
          if (result.length === 0) {
            res.status(404).json({ error: "No result found" });
            return;
          }

          finalResult.push(result);

          pool.execute<RowDataPacket[]>(
            "SELECT COUNT(*) AS total FROM egroups WHERE name LIKE ?;",
            [`%${searchValue}%`],
            (err, result) => {
              if (err) {
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
    } else if (identifier === "services" && searchValue) {
      const servicesFinalResult: RowDataPacket[][] = [];

      pool.execute<RowDataPacket[]>(
        `
        SELECT q.id, q.account_name, q.img, q.verified, COALESCE(ROUND(AVG(q1.rating), 1), 0) AS avg_rating, q.tag, COUNT(DISTINCT q1.fk_rater_user_id) AS ratings_count
        FROM users q
        LEFT JOIN seller_star_ratings q1 ON q1.fk_seller_user_id = q.id
        GROUP BY q.id
        HAVING q.tag LIKE ?
        ORDER BY RAND();
`,
        [`%${searchValue}%`],
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

          servicesFinalResult.push(result);

          pool.execute<RowDataPacket[]>(
            "SELECT COUNT(*) AS total FROM users WHERE tag LIKE ?;",
            [`%${searchValue}%`],
            (err, result) => {
              if (err) {
                console.error(err);
              }
              if (result.length === 0) {
                res.status(404).json({ error: "No reviews yet" });
              }

              servicesFinalResult.push(result);

              res.status(200).json({ servicesFinalResult });
            }
          );
        }
      );
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
