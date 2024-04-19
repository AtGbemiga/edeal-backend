import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import helmet from "helmet";
import http from "http";
import userRouter from "./routes/users";
import productRouter from "./routes/products";
import globalRouter from "./routes/global";

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

server.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}...`);
});
