import express, { Request, Response } from "express";
import getUserIDAndToken from "../users/getUserIdFromToken";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export { getAllNews };

type ReqParams = {
  id: string;
};
const getAllNews: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { id: news_id } = req.params as ReqParams;

  if (!news_id) {
    res.status(400).json({ error: "Missing required field" });
    return;
  }

  const { id: user_id } = getUserIDAndToken(req);
  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    pool.execute<RowDataPacket[]>(
      `SELECT id, img, title, body 
            FROM news
            WHERE id = ?
            ORDER BY id DESC;`,
      [news_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No results found" });
          return;
        } else {
          res.status(200).json({ result });
          return;
        }
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};
