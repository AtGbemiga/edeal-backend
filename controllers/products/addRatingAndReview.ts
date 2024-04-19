import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";
export const addRatingAndReview: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { product_id } = req.params;
  const { rating, review }: { rating: string; review: string } = req.body;
  const { id: user_id } = getUserIDAndToken(req);

  if (!product_id || !rating) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (product_id && rating && !review) {
    pool.execute<ResultSetHeader[]>(
      "INSERT INTO product_star_ratings (rating, fk_user_id, fk_product_id) VALUES (?, ?, ?)",
      [rating, user_id, product_id],
      (err, result) => {
        if (err) {
          console.error("Error adding rating and review:", err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }

        res
          .status(200)
          .json({ message: "Rating and review added successfully" });
      }
    );
  } else if (product_id && rating && review) {
    pool.getConnection((err, connection) => {
      if (err) {
        // Handle connection error
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
        return;
      } else {
        connection.query("START TRANSACTION;", (err) => {
          if (err) {
            res.status(500).json({ message: "Internal server error" });
          } else {
            try {
              connection.query<ResultSetHeader>(
                `
                      INSERT INTO product_star_ratings (rating, fk_user_id, fk_product_id) VALUES (?, ?, ?);
                      `,
                [rating, user_id, product_id],
                (err, result, fields) => {
                  if (err) {
                    // Handle event insert error
                    console.error(err);
                    res.status(500).json({ error: "Internal server error" });
                    return;
                  }

                  const fk_product_star_ratings_id = result.insertId;

                  connection.query<ResultSetHeader>(
                    `INSERT INTO product_written_reviews (review, fk_user_id, fk_product_id, fk_product_star_ratings_id) VALUES( ?, ?, ?, ?);            
                          `,
                    [review, user_id, product_id, fk_product_star_ratings_id],
                    (err) => {
                      if (err) {
                        console.error(err);

                        res
                          .status(500)
                          .json({ error: "Internal server error" });
                        return;
                      }
                      connection.query("COMMIT;", (error) => {
                        if (error) {
                          try {
                            connection.query("ROLLBACK;");
                          } catch (rollbackError) {
                            // Handle rollback error
                            console.error(rollbackError);
                          }
                          res
                            .status(500)
                            .json({ error: "Internal server error" });
                        } else {
                          res.status(200).json({
                            message: "Rating & review added successfully",
                          });
                        }
                      });
                    }
                  );
                }
              );
            } catch (error) {
              connection.query("ROLLBACK;", (rollbackError) => {
                // Handle rollback error
                console.error(rollbackError);
              });
              res.status(500).json({ error: "Internal server error" });
            } finally {
              connection.release(); // Return connection to pool
            }
          }
        });
      }
    });
  } else {
    res.status(500).json({ error: "Internal server error" });
  }
};
