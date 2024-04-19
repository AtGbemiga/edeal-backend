import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
// import { ParsedQs } from "qs";
import pool from "../../db/db";

// type Identifier = "products" | "similarProducts" | "wishList";

export const getLInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { identifier, subIdentifier, discountIdentifier } = req.query;
  console.log({ identifier, subIdentifier, discountIdentifier });

  //   let passedIdentifier: string | ParsedQs | string[] | ParsedQs[] = "";
  //   let passedDiscountIdentifier: string | ParsedQs | string[] | ParsedQs[] = "";
  let sql: string = "";

  if (!identifier) {
    res.status(400).json({ error: "Missing identifier fields" });
    return;
  }

  // TODO: Change type from any
  const params: unknown[] = [];

  if (identifier === "products" && !discountIdentifier && !subIdentifier) {
    params.push(identifier);
    sql = `SELECT q.id, q.name, q.sub_heading, q.price, SUBSTRING_INDEX(GROUP_CONCAT(q1.imgs), ',', 1) AS first_img
    FROM products q
    LEFT JOIN product_imgs q1 
    ON q1.fk_product_id = q.id
    GROUP BY q.id , q.name, q.sub_heading, q.description, q.category, q.price, q.stock_no, q.status, q.created_at;`;
  } else if (
    identifier === "products" &&
    discountIdentifier &&
    !subIdentifier
  ) {
    const parsedDiscountPercentage = parseInt(discountIdentifier as string);
    if (Number.isNaN(parsedDiscountPercentage)) {
      res.status(400).json({ error: "Invalid discount percentage" });
      return;
    }

    // Convert discount percentage to decimal value
    const decimalDiscount = parsedDiscountPercentage / 100;

    params.push(decimalDiscount);
    // passedDiscountIdentifier = discountIdentifier;
    sql = `SELECT q.id, q.name, q.sub_heading, q.price, SUBSTRING_INDEX(GROUP_CONCAT(q1.imgs), ',', 1) AS first_img, COALESCE(ROUND(AVG(q2.rating), 1), 0) AS rating, COUNT(DISTINCT q2.fk_user_id) AS ratings_count, (q.price * ?) AS discount
    FROM products q
    LEFT JOIN product_imgs q1 
    ON q1.fk_product_id = q.id
    LEFT JOIN product_star_ratings q2
    ON q2.fk_product_id = q.id
    GROUP BY q.id , q.name, q.sub_heading, q.description, q.category, q.price, q.stock_no, q.status, q.created_at;`;
  } else if (
    identifier === "similarProducts" &&
    !discountIdentifier &&
    subIdentifier
  ) {
    params.push(subIdentifier);
    sql = `
    SELECT q.id, q.name, q.price, SUBSTRING_INDEX(GROUP_CONCAT(q2.imgs), ',', 1) AS first_img
FROM products q
LEFT JOIN product_imgs q2 ON q2.fk_product_id = q.id
WHERE q.category = ?
GROUP BY q.id;
    `;
  } else if (
    identifier === "wishList" &&
    !discountIdentifier &&
    subIdentifier
  ) {
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
  }

  pool.query<RowDataPacket[]>(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    if (result.length === 0) {
      res.status(404).json({ error: "Location not found" });
      return;
    }
    // console.log({ result });

    res.status(200).json({ result });
  });
};
