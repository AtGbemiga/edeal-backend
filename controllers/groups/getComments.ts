// import express, { Request, Response } from "express";
// import { RowDataPacket } from "mysql2";
// import pool from "../../db/db";

// export const getGroupComments: express.RequestHandler = (
//   req: Request,
//   res: Response
// ) => {
//   const { group_post_id } = req.params;

//   if (!group_post_id) {
//     res.status(400).json({ error: "Missing required fields" });
//     return;
//   }

//   try {
//     pool.execute<RowDataPacket[]>(
//       `
//       SELECT q.id, q.comment, q.created_at, q1.account_name, q1.img
// FROM egroup_post_comments q
// LEFT JOIN users q1 ON q.fk_user_id = q1.id
// WHERE q.fk_group_post_id = ?
// ORDER BY q.created_at DESC
// LIMIT 3 OFFSET 0

//             `,
//       [group_post_id],
//       (err, result) => {
//         if (err) {
//           console.error(err);
//           res.status(500).json({ error: "Internal server error" });
//           return;
//         }
//         res.status(200).json({ result });
//       }
//     );
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
