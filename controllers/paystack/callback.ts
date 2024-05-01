import { Request, Response } from "express";
import { verify } from "./verify";

export const callback = async (req: Request, res: Response): Promise<void> => {
  const { reference: referenceID } = req.query as { reference: string };
  console.log({ referenceID });

  verify({ referenceID })
    .then((response) => {
      if (response.data.status === "success") {
        // TODO: Save vital details to database
        res.status(200).json({ response });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Error occurred", error: error });
    });
};
