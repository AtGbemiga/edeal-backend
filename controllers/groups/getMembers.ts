import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../../db/db";

export const getGroupMembers: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_id } = req.params;

  if (!group_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT q.id,
      q1.account_name,
      q1.img
  FROM egroup_members q
  LEFT JOIN users q1 ON q1.id = q.fk_user_id
  WHERE q.fk_group_id =?;
  
      
            `,
      [group_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No group member" });
        }
        res.status(200).json({ result });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
