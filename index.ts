import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import helmet from "helmet";
import http from "http";
import WebSocket from "ws";

const app = express();
const server = http.createServer(app); // Create HTTP server

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import userRouter from "./routes/users";
import productRouter from "./routes/products";
import globalRouter from "./routes/global";
import groupRouter from "./routes/groups";
import payStackRouter from "./routes/paystack";
import edealsRouter from "./routes/edeals";
import chatRouter from "./routes/chat";
import pool from "./db/db";

// Create a map to store user IDs and their WebSocket connections
const userConnections = new Map<number, WebSocket>();

// Attach WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

wss.on("connection", function connection(ws: WebSocket) {
  ws.on("error", console.error);

  // Handle incoming messages
  ws.on("message", function incoming(message) {
    console.log("receivedhdhh: %s", message);
    // Parse the incoming message
    const data = JSON.parse(message.toString());
    const userId = data.senderId;
    console.log({ rid: data.recipientId });
    console.log({ userId });

    // Associate the user ID with this WebSocket connection
    userConnections.set(userId, ws);

    // Save message to database and send to recipient
    saveMessageToDatabase(userId, data.recipientId, data.message);
    sendMessageToRecipient(userId, data.recipientId, data.message);
  });

  // Remove the connection from the map when it is closed
  ws.on("close", () => {
    userConnections.forEach((value, key) => {
      if (value === ws) {
        userConnections.delete(key);
      }
    });
  });
});

// Function to save the message to the database
function saveMessageToDatabase(
  senderId: number,
  recipientId: number,
  message: string
) {
  const query =
    "INSERT INTO chat (fk_sender_id, recipient_id, message) VALUES (?, ?, ?)";
  pool.execute(query, [senderId, recipientId, message], function (error) {
    if (error) throw error;
    console.log("Message saved to database");
  });
}

// Function to send the message to the recipient
// function sendMessageToRecipient(
//   senderId: number,
//   recipientId: number,
//   message: string
// ) {
//   console.log({ send: { senderId, recipientId, message } });

//   // Find the WebSocket connection of the recipient
//   const recipientWs = userConnections.get(recipientId);
//   if (recipientWs) {
//     recipientWs.send(JSON.stringify({ senderId, recipientId, message }));
//   } else {
//     console.log(`Recipient with ID ${recipientId} is not connected`);
//   }
// }

function sendMessageToRecipient(
  senderId: number,
  recipientId: number,
  message: string
) {
  console.log({ send: { senderId, recipientId, message } });

  const recipientWs = userConnections.get(recipientId);
  const senderWs = userConnections.get(senderId);

  if (recipientWs) {
    recipientWs.send(JSON.stringify({ senderId, recipientId, message }));
  } else {
    console.log(`Recipient with ID ${recipientId} is not connected`);
  }

  if (senderWs) {
    senderWs.send(
      JSON.stringify({
        senderId,
        recipientId,
        message,
        status: recipientWs ? "delivered" : "saved",
      })
    );
  }
}

app.get("/", (req: Request, res: Response) => {
  res.send("E-Deals API is running...");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/global", globalRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/paystack", payStackRouter);
app.use("/api/v1/edeals", edealsRouter);
app.use("/api/v1/chat", chatRouter);

server.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}...`);
});
