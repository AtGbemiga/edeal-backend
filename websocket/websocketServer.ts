// websocket.ts
import { Server } from "http";
import WebSocket from "ws";
import pool from "../db/db";

const userConnections = new Map<number, WebSocket>();

export { setupWebSocketServer };

function setupWebSocketServer(server: Server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", function connection(ws: WebSocket) {
    ws.on("error", console.error);

    ws.on("message", function incoming(message) {
      console.log("received: %s", message);
      const data = JSON.parse(message.toString());
      const userId = data.senderId;
      console.log({ rid: data.recipientId });
      console.log({ userId });

      userConnections.set(userId, ws);

      saveMessageToDatabase(userId, data.recipientId, data.message);
      sendMessageToRecipient(userId, data.recipientId, data.message);
    });

    ws.on("close", () => {
      userConnections.forEach((value, key) => {
        if (value === ws) {
          userConnections.delete(key);
        }
      });
    });
  });
}

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
