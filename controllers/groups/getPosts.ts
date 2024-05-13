import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";

// wrongly sending back comments as duplicate
export const getGroupPosts: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_id } = req.params;

  if (!group_id) {
    res.status(400).json({ error: "Missing group id fields" });
    return;
  }

  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  } else {
    try {
      pool.execute<RowDataPacket[]>(
        `
        SELECT 
    egp.id, 
    egp.post, 
    egp.created_at, 
    COALESCE(egp.shares, 0) AS shares, 
    COALESCE(egp.views, 0) AS views,
    JSON_ARRAYAGG(eimg.imgs) AS imgs, 
    u.account_name AS account_name, 
    u.img AS owner_img, 
    COUNT(epl.fk_user_id) AS likes,
    (SELECT COUNT(*) FROM egroup_post_likes WHERE fk_group_post_id = egp.id AND fk_user_id = ?) AS user_liked,
    (SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        "comment_id", epc.id,
        "comment", epc.comment,
        "created_at", epc.created_at,
        "commentator_img", uc.img,
        "commentator_account_name", uc.account_name
      )
    ) FROM egroup_post_comments epc
    LEFT JOIN users uc ON epc.fk_user_id = uc.id
    WHERE epc.fk_group_post_id = egp.id
    ORDER BY epc.created_at DESC
    LIMIT 3 OFFSET 0
    ) AS post_comments,
    (SELECT COUNT(*) FROM egroup_post_comments WHERE fk_group_post_id = egp.id) AS total_comments
FROM egroup_posts egp
LEFT JOIN users u ON egp.fk_user_id = u.id
LEFT JOIN egroup_post_likes epl ON epl.fk_group_post_id = egp.id
LEFT JOIN egroup_post_imgs eimg ON eimg.fk_group_post_id = egp.id
LEFT JOIN egroups eg ON eg.id = egp.fk_group_id
WHERE eg.id = ?
GROUP BY egp.id
ORDER BY egp.created_at DESC;    
            `,
        [user_id, group_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No posts yet." });
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
