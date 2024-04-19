import jwt from "jsonwebtoken";

export const jwtGenerateToken = (id: number) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};
