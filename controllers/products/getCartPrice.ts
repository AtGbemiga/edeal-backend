import { Request } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const getCartPrice = async (req: Request): Promise<number> => {
  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    return Promise.reject({ status: 401, message: "Unauthorized" });
  }

  return new Promise((resolve, reject) => {
    pool.execute<RowDataPacket[]>(
      `
              SELECT SUM(personalized_price * qty) AS db_price
              FROM cart
              WHERE fk_user_id = ?;
              `,
      [user_id],
      (err, result) => {
        if (err) {
          reject({ status: 500, message: "Internal server error" });
          return;
        }
        if (result.length === 0 || result[0].db_price === null) {
          reject({ status: 404, message: "No cart price found" });
          return;
        }

        resolve(result[0].db_price);
      }
    );
  });
};
