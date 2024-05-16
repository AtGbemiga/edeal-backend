import { Request, Response } from "express";
import getUserIDAndToken from "../controllers/users/getUserIdFromToken";

export const getUserId = (req: Request, res: Response) => {
  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(400).json({ error: "Unauthorized" });
  } else {
    res.status(200).json({ user_id });
  }
};
