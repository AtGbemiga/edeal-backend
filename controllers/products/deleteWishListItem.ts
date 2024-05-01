import express, { Request, Response } from "express";
import pool from "../../db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";

/**
 * aim: delete cart item
 * process:
 * 1. get user id
 * 2. check if the user_id matches the user_id in associated with the cart item
 * 3. delete cart item
 */
export const deleteWishListItem: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { wishlistItemId } = req.params;
  const { id: user_id } = getUserIDAndToken(req);

  console.log({ wishlistItemId, user_id });

  if (!user_id || !wishlistItemId) {
    res.status(401).json({ error: "Unauthorized" });
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
          `
              SELECT * FROM product_wishlist WHERE id = ?;
              `,
          [wishlistItemId],
          (err, result) => {
            if (err) {
              console.error(err);
              connection.rollback(() => {
                console.error(err);
                res.status(500).json({ error: "Internal server error" });
              });
              return;
            }
            if (result.length === 0) {
              connection.rollback(() => {
                console.error(err);
                res.status(404).json({ error: "Item not found" });
              });
              return;
            }

            connection.query<RowDataPacket[]>(
              `
                        SELECT * FROM product_wishlist WHERE id = ? AND fk_user_id = ?;
                      `,
              [wishlistItemId, user_id],
              (err, result) => {
                if (err) {
                  console.error(err);
                  connection.rollback(() => {
                    console.error(err);
                    res.status(500).json({ error: "Internal server error" });
                  });
                  return;
                }

                if (result.length === 0) {
                  connection.rollback(() => {
                    res.status(401).json({ error: "Unauthorized" });
                  });
                  return;
                }

                connection.query<ResultSetHeader>(
                  `
                          DELETE FROM product_wishlist WHERE id = ? AND fk_user_id = ?;
                          `,
                  [wishlistItemId, user_id],
                  (err, result) => {
                    if (err) {
                      console.error(err);
                      connection.rollback(() => {
                        console.error(err);
                        res
                          .status(500)
                          .json({ error: "Internal server error" });
                      });
                      return;
                    }

                    if (result.affectedRows === 0) {
                      connection.rollback(() => {
                        res.status(404).json({
                          error: "No product wishlist item to delete",
                        });
                      });
                      return;
                    }

                    connection.commit((err) => {
                      if (err) {
                        console.error(err);
                        connection.rollback(() => {
                          console.error(err);
                          res
                            .status(500)
                            .json({ error: "Internal server error" });
                        });
                        return;
                      }

                      res.status(200).json({
                        message: "Product wishlist item deleted successfully",
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });

      connection.release();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
