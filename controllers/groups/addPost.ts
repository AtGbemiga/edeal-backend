import express, { Request, Response } from "express";
import pool from "../../db/db";
import multer from "multer";
import { upload } from "../../multer/multer";
import cloudinary from "../../cloudinary/cloudinary";
import getUserIDAndToken from "../users/getUserIdFromToken";
import { ResultSetHeader } from "mysql2";

export const addGroupPost: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { id: user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  console.log({ "req.files": req.files });

  upload.array("imgs", 3)(req, res, async (error) => {
    if (error) {
      // Handle error
      if (error.message === "Unexpected field") {
        // console.log(error.message);

        res.status(400).json({ error: "Maximum of 3 images allowed" });
        return;
      }

      // console.log(error.message);

      res.status(500).json({ error: "Internal server error" });
      return;
    }
    console.log({ "req.files": req.files });
    // Handle multer upload error
    if (error instanceof multer.MulterError) {
      // Handle Multer error
      // console.log(error.message);

      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const { post, fk_group_id } = req.body;

    console.log({ post, fk_group_id, user_id });
    if (!req.files || req.files.length === 0) {
      pool.execute<ResultSetHeader>(
        "INSERT INTO egroup_posts (post, fk_group_id, fk_user_id) VALUES (?, ?, ?)",
        [post, fk_group_id, user_id],
        (error) => {
          if (error) {
            console.error(error);
            res.status(500).json({ error });
          } else {
            res.status(201).json({ message: "Post created successfully" });
          }
        }
      );
    } else {
      // Handle the case where req.files is not an array
      if (!Array.isArray(req.files)) {
        console.error("req.files is not an array");

        res.status(500).json({ error: "Internal server error" });
        return;
      }

      //   const { post, tag }: { post: string; tag: string } = req.body;

      // Upload pictures to Cloudinary
      const pictureUrls = Array<string>();
      console.log(req.files);
      // Upload each picture to Cloudinary and store the secure URLs
      for (const file of req.files) {
        const uniqueIdentifier =
          Date.now() + "-" + Math.round(Math.random() * 1e9);
        const publicId = `${user_id}_group_img_${uniqueIdentifier}`;

        const result = await cloudinary.uploader.upload(file.path, {
          public_id: publicId,
        });

        pictureUrls.push(result.secure_url);
      }

      pool.getConnection((error, connection) => {
        if (error) {
          // Handle connection error
          console.error(error);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else {
          connection.query("START TRANSACTION;", (error) => {
            if (error) {
              // Handle transaction start error
              res.status(500).json({ error: "Internal server error" });
              return;
            } else {
              try {
                // Insert event data
                connection.query<ResultSetHeader>(
                  "INSERT INTO egroup_posts (post, fk_group_id, fk_user_id) VALUES (?, ?, ?)",
                  [post, fk_group_id, user_id],
                  (error, results) => {
                    if (error) {
                      // Handle event insert error
                      console.error(error);
                      res.status(500).json({ error: "Internal server error" });
                      return;
                    }

                    const fk_group_post_id = results.insertId;

                    // Insert image URLs
                    const values = pictureUrls.map((imageUrl) => [
                      fk_group_post_id,
                      imageUrl,
                    ]);
                    connection.query(
                      "INSERT INTO egroup_post_imgs (fk_group_post_id, imgs) VALUES ?",
                      [values],
                      (error) => {
                        if (error) {
                          // Handle image insert error
                          console.error(error);
                          res
                            .status(500)
                            .json({ error: "Internal server error" });
                          return;
                        }

                        connection.query("COMMIT;", (error) => {
                          if (error) {
                            try {
                              connection.query("ROLLBACK;");
                            } catch (rollbackError) {
                              // Handle rollback error
                              console.error(rollbackError);
                            }
                            res
                              .status(500)
                              .json({ error: "Internal server error" });
                          } else {
                            res
                              .status(200)
                              .json({ message: "Post created successfully" });
                          }
                        });
                      }
                    );
                  }
                );
              } catch (error) {
                connection.query("ROLLBACK;", (rollbackError) => {
                  // Handle rollback error
                  console.error(rollbackError);
                });
                res.status(500).json({ error: "Internal server error" });
              } finally {
                connection.release(); // Return connection to pool
              }
            }
          });
        }
      });
    }
  });
};
