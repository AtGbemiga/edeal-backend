import { Request, Response } from "express";
import { verify } from "./verify";
import pool from "../../db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

/**
 * Aim: Verify payment, save the order to database then send response
 * Process:
 * // if payment is successful
 * get the verify fn email, referenceID, and payment_status
 * get all the associated products in the cart table
 * save the verify fn email, referenceID, and payment_status along with the associated products in orders table
 * // if payment is not successful
 * send error response
 */

// TODO: Check if the amount paid matches the expected amount, then Add logic to delete item from cart
interface Products {
  id: number;
  qty: number;
  personalized_price: number;
  colour: string;
  size: string;
  fk_product_id: number;
}
export const callback = async (req: Request, res: Response): Promise<void> => {
  const { reference: referenceID } = req.query as { reference: string };
  console.log({ referenceID });

  verify({ referenceID })
    .then((response) => {
      // if payment is successful
      if (response.data.status === "success") {
        // get the verify fn email, referenceID, and payment_status
        const { email } = response.data.customer;
        const { reference: referenceID } = response.data;
        const { status: payment_status } = response.data;
        console.log({ email, referenceID, payment_status });

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

              // get user_id via email
              connection.query<RowDataPacket[]>(
                `
                              SELECT q1.id
FROM cart q
LEFT JOIN users q1 ON q.fk_user_id = q1.id
WHERE q1.email = ?;
                              `,
                [email],
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
                      res.status(404).json({ error: "No data available" });
                    });
                    return;
                  }

                  const user_id = result[0].id;
                  console.log({ user_id });

                  // get all the associated products in the cart table
                  connection.query<RowDataPacket[]>(
                    `
                                      SELECT id, qty, personalized_price, colour, size, fk_product_id
FROM cart
WHERE fk_user_id = ?;
                                      `,
                    [user_id],
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

                      if (result.length === 0) {
                        connection.rollback(() => {
                          console.error(err);
                          res.status(404).json({ error: "No data available" });
                        });
                        return;
                      }

                      const products: Products[] = result.map((product) => ({
                        id: product.id,
                        qty: product.qty,
                        personalized_price: product.personalized_price,
                        colour: product.colour,
                        size: product.size,
                        fk_product_id: product.fk_product_id,
                      }));
                      console.log({ products });

                      const values = products.map((product) => [
                        email,
                        product.qty,
                        product.personalized_price,
                        product.colour,
                        product.size,
                        payment_status,
                        referenceID,
                        product.fk_product_id,
                      ]);
                      console.log({ values });

                      // save the verify fn email, referenceID, and payment_status along with the associated products in orders table

                      connection.query<ResultSetHeader>(
                        `
                                              INSERT INTO orders (fk_user_email, qty, personalized_price, colour, size, payment_status, reference_id, fk_product_id)
  VALUES ?;
                                              `,
                        [values],
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
                          connection.commit((err) => {
                            if (err) {
                              console.error(err);
                              res
                                .status(500)
                                .json({ error: "Internal server error" });
                              return;
                            }
                            res.status(200).json(response.data.status);
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
          res.status(500).json({ message: "Error occurred", error: error });
        }
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Error occurred", error: error });
    });
};
