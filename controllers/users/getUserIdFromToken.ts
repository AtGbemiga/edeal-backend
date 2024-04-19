import { Request } from "express";
import jwt from "jsonwebtoken";

interface TokenData {
  id: string;
}

export default function getUserIDAndToken(req: Request): {
  id: string;
  token: string;
} {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return { id: "", token: "" };
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenData;

    return { id: decodedToken.id, token };
  } catch (error) {
    console.error("Error decoding token:", error);
    return { id: "", token: "" };
  }
}
