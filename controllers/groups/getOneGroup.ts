import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const getGroupFInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_id } = req.params;

  if (!group_id) {
    res.status(400).json({ error: "Missing group_id" });
    return;
  }

  const { id: user_id } = getUserIDAndToken(req);

  // TODO: send user_has_joined as 0 if no user_id
  if (!user_id) {
    try {
      pool.execute<RowDataPacket[]>(
        `
        SELECT q.id,
      q.name,
      q.about,
      q.logo,
      q.fk_user_id
      , COUNT(q1.fk_user_id) as member_total
  FROM egroups q
  LEFT JOIN egroup_members q1 ON q1.fk_group_id = q.id
  WHERE q.id = ?
  GROUP BY q.id;
      `,
        [group_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "Group not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    try {
      pool.execute<RowDataPacket[]>(
        `
        SELECT q.id,
    q.name,
    q.about,
    q.logo,
    q.fk_user_id
    , COUNT(q1.fk_user_id) as member_total,
CASE WHEN EXISTS (
  SELECT 1
  FROM egroup_members q2
  WHERE q2.fk_group_id = q.id
    AND q2.fk_user_id = ?
) THEN 1 ELSE 0 END AS user_has_joined
FROM egroups q
LEFT JOIN egroup_members q1 ON q1.fk_group_id = q.id
WHERE q.id = ?
GROUP BY q.id;
      `,
        [user_id, group_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "Group not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
