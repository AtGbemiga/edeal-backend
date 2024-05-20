import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
// import { ParsedQs } from "qs";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

type reqQueryProps = {
  identifier:
    | "products"
    | "similarProducts"
    | "wishList"
    | "groups"
    | "orders"
    | "news";
  subIdentifier?: string;
};

export const getLInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { identifier, subIdentifier } = req.query as reqQueryProps;
  const { id: user_id } = getUserIDAndToken(req);

  let sql: string = "";
  const identifierKey = `${identifier}Res`;

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!identifier) {
    res.status(400).json({ error: "Missing identifier fields" });
    return;
  }

  // TODO: Change type from any
  const params: unknown[] = [];

  if (identifier === "products" && !subIdentifier) {
    params.push(user_id);
    sql = `
    SELECT q.id, q.name, q.sub_heading, q.price, SUBSTRING_INDEX(GROUP_CONCAT(q1.imgs), ',', 1) AS first_img, COALESCE(ROUND(AVG(q2.rating), 1), 0) AS rating, COUNT(DISTINCT q2.fk_user_id) AS ratings_count, q.discount_percent AS discount, ROUND(q.price * (1 - q.discount_percent / 100), 0) AS discount_price, q3.id AS wishlist_id, CASE WHEN EXISTS (
      SELECT 1
      FROM product_wishlist q2
      WHERE q2.fk_product_id = q.id
        AND q2.fk_user_id = ?
    ) THEN 1 ELSE 0 END AS user_has_wishlisted
        FROM products q
        LEFT JOIN product_imgs q1 
        ON q1.fk_product_id = q.id
        LEFT JOIN product_star_ratings q2
        ON q2.fk_product_id = q.id
        LEFT JOIN product_wishlist q3 ON q3.fk_product_id = q.id
        GROUP BY q.id , q.name, q.sub_heading, q.description, q.category, q.price, q.stock_no, q.status, q.created_at, wishlist_id;
    `;
  } else if (identifier === "similarProducts" && subIdentifier) {
    params.push(subIdentifier);
    sql = `
    SELECT q.id, q.name, q.price, SUBSTRING_INDEX(GROUP_CONCAT(q2.imgs), ',', 1) AS first_img
FROM products q
LEFT JOIN product_imgs q2 ON q2.fk_product_id = q.id
WHERE q.category = ?
GROUP BY q.id;
    `;
  } else if (identifier === "wishList" && subIdentifier) {
    params.push(subIdentifier);
    sql = `
    SELECT q.id, q1.name, q1.sub_heading, q1.price, SUBSTRING_INDEX(GROUP_CONCAT(q2.imgs), ',', 1) AS first_img
    FROM product_wishlist q
    LEFT JOIN products q1 
    ON q.fk_product_id = q1.id
    LEFT JOIN product_imgs q2
    ON q2.fk_product_id = q1.id
    WHERE q.fk_user_id = ?
    GROUP BY q.id , q1.name, q1.sub_heading, q1.description, q1.category, q1.price, q1.stock_no, q1.status, q1.created_at;
    `;
  } else if (identifier === "groups" && !subIdentifier) {
    sql = `
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
GROUP BY 
    q.id;
    `;
  } else if (identifier === "orders" && !subIdentifier) {
    params.push(user_id);
    sql = `
    SELECT q.id, q1.id AS user_id, q2.id AS product_id, q.fk_user_email, q.reference_id, q.created_at, q.order_status, q1.account_name AS buyer_name, q2.name, q2.price, SUBSTRING_INDEX(GROUP_CONCAT(q3.imgs), ',', 1) AS first_img,
    CASE WHEN EXISTS(
      SELECT 1 FROM product_star_ratings q3
      WHERE q3.fk_user_id = q1.id
      AND q3.fk_product_id = product_id
  ) THEN 1 ELSE 0 END AS user_has_rated
FROM orders q
LEFT JOIN users q1 ON q.fk_user_email = q1.email
LEFT JOIN products q2 ON q2.id = q.fk_product_id
LEFT JOIN product_imgs q3 ON q3.fk_product_id = q.fk_product_id
GROUP BY q.id
HAVING q1.id = ?;
    `;
  } else if (identifier === "news" && !subIdentifier) {
    sql = `
    SELECT id, img, title 
            FROM news
            ORDER BY id DESC;
    `;
  }

  pool.query<RowDataPacket[]>(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    if (result.length === 0) {
      res.status(404).json({ error: "Results not found" });
      return;
    }

    res.status(200).json({ [identifierKey]: result });
  });
};
