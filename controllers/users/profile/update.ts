import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import cloudinary from "../../../cloudinary/cloudinary";
import pool from "../../../db/db";
import { upload } from "../../../multer/multer";
import getUserIDAndToken from "../getUserIdFromToken";

export const updateProfile: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  upload.single("img")(req, res, async (err) => {
    if (err) {
      if (err.message === "Unexpected field") {
        res.status(400).json({ error: "Maximum of 1 image allowed" });
        return;
      }
    }

    const {
      address,
      phone_number,
      account_name,
      email,
      tag,
    }: {
      address: string;
      phone_number: string;
      account_name: string;
      email: string;
      tag: string;
    } = req.body;

    // create uniqueIdentifier for the image
    const uniqueIdentifier = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // create publicId for the image for cloudinary
    const publicId = `profile-img-${uniqueIdentifier}`;

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" }); 
      return;
    }

    if (!address || !phone_number || !account_name || !email) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: publicId,
      });
      const imgURL = result.secure_url;

      pool.execute<ResultSetHeader>(
        `
                UPDATE users
                SET img = ?, address = ?, phone_number = ?, account_name = ?, email = ?, tag = ?
                WHERE id = ?
                `,
        [imgURL, address, phone_number, account_name, email, tag, user_id],
        (err) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else {
            res.status(200).json({ message: "Profile updated successfully" });
          }
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
};
