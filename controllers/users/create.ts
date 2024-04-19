import express, { Request, Response } from "express";
import pool from "../../db/db";
import { jwtGenerateToken } from "../../middleware/jwt/jwt";
import { setToken } from "../../middleware/jwt/setToken";
import { ResultSetHeader } from "mysql2";
import {
  generateSalt,
  hashPassword,
} from "../../middleware/bcrypt/bcryptUtils";
// import { validateInputLength } from "../../middleware/inputs/checkLength";
// import nodemailerFn from "../../nodemailer/nodemailer";
// import { msg } from "../../nodemailer/messages/createUser";

// add nodemailer usage

/**
 * check if email is already in use
 * check if account_type and account_name already exsists
 * handle all error
 * hash password
 * insert user into db
 */

//TODO: convert phone_number to INT before inserting in db
export const createUser: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  const {
    email,
    password,
    phone_number,
    account_type,
    account_name,
  }: {
    email: string;
    password: string;
    phone_number: string;
    account_type: string;
    account_name: string;
  } = req.body;

  if (!email || !password || !phone_number || !account_type || !account_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate the length of the inputs
  //   const validationFields = [
  //     { name: "first_name", maxLength: 20 },
  //     { name: "email", maxLength: 60 },
  //     { name: "password", maxLength: 100 },
  //     { name: "last_name", maxLength: 20 },
  //   ];

  //   const validationErrors = validateInputLength(
  //     { first_name, email, password, last_name },
  //     validationFields
  //   );

  //   if (validationErrors.length > 0) {
  //     return res
  //       .status(400)
  //       .json({ error: "Input(s) too long", fields: validationErrors });
  //   }

  const saltRounds = 10;

  try {
    // check if user exists with the same account_type and account_name
    const userExists = new Promise<boolean>((resolve) => {
      pool.execute(
        "SELECT email FROM users WHERE email = ? OR (account_type = ? AND account_name = ?);",
        [email, account_type, account_name],
        (err, result) => {
          if (err) {
            return res.status(400).json({ error: err.message });
          } else {
            resolve(result.constructor === Array && result.length > 0);
          }
        }
      );
    });

    // send error if user exists
    const exists = await userExists;
    if (exists) {
      res.status(400).json({ error: "Email/Username taken. Choose another." });
      return;
    }

    // hash password
    const salt = await generateSalt(saltRounds);
    const hash = await hashPassword(password, salt);

    pool.execute<ResultSetHeader>(
      "INSERT INTO users ( email, password, phone_number, account_type, account_name) VALUES (?, ?, ?, ?, ?)",
      [email, hash, phone_number, account_type, account_name],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: "Internal server error" });
          return;
        } else {
          // id = user id
          const id = result.insertId;
          const token = jwtGenerateToken(id);

          // set token in cookie
          setToken(req, res, token);

          res.status(200).json({
            message: "User created successfully",
            token,
          });
        }
      }
    );

    // send nodemailer
    // nodemailerFn(msg, email, "Welcome to Evenue", msg);
  } catch (error) {
    console.log(error);
  }
};
