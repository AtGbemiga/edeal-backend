import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import helmet from "helmet";
import http from "http";
import userRouter from "./routes/users";
import productRouter from "./routes/products";
import globalRouter from "./routes/global";
import groupRouter from "./routes/groups";
import payStackRouter from "./routes/paystack";

const app = express();
const server = http.createServer(app); // Create HTTP server

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("E-Deals API is running...");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/global", globalRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/paystack", payStackRouter);

server.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}...`);
});
