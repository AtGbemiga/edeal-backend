import express, { Request, Response } from "express";

import { RowDataPacket } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const noticeByUserTag: express.RequestHandler = (
  req: Request,
  res: Response
): void => {
  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res
      .status(401)
      .json({ message: "Unauthorized. Please login to continue." });
    return;
  }

  try {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("Error connecting to database:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      // get the tag associated with the user_id
      connection.query<RowDataPacket[]>(
        `
              SELECT tag FROM users WHERE id = ?;
              `,
        [user_id],
        (err, result) => {
          if (err) {
            console.error(err);
            connection.rollback(() => {
              console.error(err);
              res.status(500).json({ error: "Internal server error" });
            });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No results found" });
            return;
          }

          const userTag: string = result[0].tag;

          connection.query<RowDataPacket[]>(
            `
            SELECT COUNT(id) AS unread
FROM market
WHERE tag = ? AND created_at > (
	SELECT last_viewed 
    FROM notice
    LEFT JOIN users ON notice.fk_user_id = users.id
    WHERE users.id = ?
);
                          `,
            [userTag, user_id],
            (err, result) => {
              if (err) {
                console.error("Error invalidating token:", err);
                res.status(500).json({ error: "Internal server error" });
                return;
              } else if (result.length === 0) {
                res.status(404).json({ error: "No results found" });
                return;
              }

              connection.commit((err) => {
                if (err) {
                  console.error(err);
                  connection.rollback(() => {
                    console.error(err);
                    res.status(500).json({ error: "Internal server error" });
                  });
                  return;
                }

                res.status(200).json({ result });
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
