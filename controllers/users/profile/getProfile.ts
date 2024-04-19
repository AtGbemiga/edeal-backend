import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../../../db/db";
import getUserIDAndToken from "../getUserIdFromToken";

export const getProfile: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { acc_id } = req.params;
  console.log({ acc_id });

  const { id: reviewer_id } = getUserIDAndToken(req);

  if (!acc_id || !reviewer_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    if (acc_id && !reviewer_id) {
      pool.execute<RowDataPacket[]>(
        `
        SELECT
    q.id,
    q.account_name,
    q.phone_number,
    q.email,
    q.verified,
    q.img,
    q3.bio,
    GROUP_CONCAT(q1.imgs) AS imgs,
    COUNT(DISTINCT q2.fk_seller_user_id) AS total_raings_no,
    opening_hours.opening_hours
FROM users q
LEFT JOIN seller_acc_imgs q1 ON q1.fk_user_id = q.id
LEFT JOIN seller_acc_written_reviews q2 ON q2.fk_seller_user_id = q.id
LEFT JOIN seller_acc_extra_info q3 ON q3.fk_user_id = q.id
LEFT JOIN (
    SELECT fk_user_id,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'hours_id', id,
                'MONDAY_OPEN', MONDAY_OPEN,
                'MONDAY_CLOSE', MONDAY_CLOSE,
                'TUESDAY_OPEN', TUESDAY_OPEN,
                'TUESDAY_CLOSE', TUESDAY_CLOSE,
                'WEDNESDAY_OPEN', WEDNESDAY_OPEN,
                'WEDNESDAY_CLOSE', WEDNESDAY_CLOSE,
                'THURSDAY_OPEN', THURSDAY_OPEN,
                'THURSDAY_CLOSE', THURSDAY_CLOSE,
                'FRIDAY_OPEN', FRIDAY_OPEN,
                'FRIDAY_CLOSE', FRIDAY_CLOSE,
                'SATURDAY_OPEN', SATURDAY_OPEN,
                'SATURDAY_CLOSE', SATURDAY_CLOSE,
                'SUNDAY_OPEN', SUNDAY_OPEN,
                'SUNDAY_CLOSE', SUNDAY_CLOSE
            )
        ) AS opening_hours
    FROM seller_acc_opening_hours
    GROUP BY fk_user_id
) AS opening_hours ON q.id = opening_hours.fk_user_id
WHERE q.id = ?
GROUP BY q.id, q3.bio
ORDER BY q.id DESC;  
                `,
        [acc_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No results found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } else if (acc_id && reviewer_id) {
      pool.execute<RowDataPacket[]>(
        `
                SELECT
                    q.id,
                    q.account_name,
                    q.phone_number,
                    q.email,
                    q.verified,
                    q.img,
                    q3.bio,
                    JSON_ARRAYAGG(q1.imgs) AS imgs,
                    COUNT(DISTINCT q2.fk_reviewer_user_id) AS total_raings_no,
                    opening_hours.opening_hours,
                    CASE WHEN EXISTS(
                    SELECT 1 FROM seller_acc_written_reviews q4 WHERE q4.fk_reviewer_user_id = ?
                    ) THEN 1 ELSE 0 END AS user_has_reviewed
                FROM users q
                LEFT JOIN seller_acc_imgs q1 ON q1.fk_user_id = q.id
                LEFT JOIN seller_acc_written_reviews q2 ON q2.fk_seller_user_id = q.id
                LEFT JOIN seller_acc_extra_info q3 ON q3.fk_user_id = q.id
                LEFT JOIN (
                    SELECT fk_user_id,
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'hours_id', id,
                                'MONDAY_OPEN', MONDAY_OPEN,
                                'MONDAY_CLOSE', MONDAY_CLOSE,
                                'TUESDAY_OPEN', TUESDAY_OPEN,
                                'TUESDAY_CLOSE', TUESDAY_CLOSE,
                                'WEDNESDAY_OPEN', WEDNESDAY_OPEN,
                                'WEDNESDAY_CLOSE', WEDNESDAY_CLOSE,
                                'THURSDAY_OPEN', THURSDAY_OPEN,
                                'THURSDAY_CLOSE', THURSDAY_CLOSE,
                                'FRIDAY_OPEN', FRIDAY_OPEN,
                                'FRIDAY_CLOSE', FRIDAY_CLOSE,
                                'SATURDAY_OPEN', SATURDAY_OPEN,
                                'SATURDAY_CLOSE', SATURDAY_CLOSE,
                                'SUNDAY_OPEN', SUNDAY_OPEN,
                                'SUNDAY_CLOSE', SUNDAY_CLOSE
                            )
                        ) AS opening_hours
                    FROM seller_acc_opening_hours
                    GROUP BY fk_user_id
                ) AS opening_hours ON q.id = opening_hours.fk_user_id
                WHERE q.id = ?
                GROUP BY q.id, q3.bio
                ORDER BY q.id DESC;   
                `,
        [reviewer_id, acc_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No results found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
