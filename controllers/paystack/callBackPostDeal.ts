import { Request, Response } from "express";
import { verify } from "./verify";

export const callbackPostDeal = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reference: referenceID } = req.query as { reference: string };
  console.log({ referenceID });

  verify({ referenceID })
    .then((response) => {
      console.log({ response });

      // if payment is successful
      if (response.data.status === "success") {
        res.status(200).json({ message: "Paymnet succesful" });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Error occurred", error: error });
    });
};
