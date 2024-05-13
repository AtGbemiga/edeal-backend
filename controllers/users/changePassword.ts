import express, { Request, Response } from "express";
import pool from "../../db/db";
import getUserIDAndToken from "./getUserIdFromToken";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { validateInputLength } from "../../middleware/inputs/checkLength";
import {
  comparePassword,
  hashPassword,
  generateSalt,
} from "../../middleware/bcrypt/bcryptUtils";

export const changePassword: express.RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  // get the user_id from the token
  const { id: user_id } = getUserIDAndToken(req);

  const {
    oldPassword,
    newPassword,
  }: { oldPassword: string; newPassword: string } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  // Validate the length of the inputs
  const validationFields = [
    { name: "oldPassword", maxLength: 100 },
    { name: "newPassword", maxLength: 100 },
  ];

  const validationErrors = validateInputLength(
    { oldPassword, newPassword },
    validationFields
  );

  if (validationErrors.length > 0) {
    res
      .status(400)
      .json({ error: "Input(s) too long", fields: validationErrors });
    return;
  }

  const saltRounds = 10;
  try {
    const salt = await generateSalt(saltRounds);
    const hash = await hashPassword(newPassword, salt);

    // check if the user exists in the database
    pool.execute<RowDataPacket[]>(
      "SELECT id, password FROM users WHERE id = ?",
      [user_id],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        if (result.length === 0) {
          res.status(404).json({ error: "User not found" });
          return;
        }

        const storedHash: string = result[0].password;

        // Compare the entered password with the stored hash
        comparePassword(oldPassword, storedHash).then((isMatch) => {
          if (!isMatch) {
            res.status(401).json({ error: "Invalid old password" });
            return;
          } else {
            // update it in the database
            pool.execute<ResultSetHeader>(
              "UPDATE users SET password = ? WHERE id = ?",
              [hash, user_id],
              (err) => {
                if (err) {
                  res.status(500).json({ error: "Internal server error" });
                  return;
                }
                res
                  .status(200)
                  .json({ message: "Password changed successfully" });
              }
            );
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
