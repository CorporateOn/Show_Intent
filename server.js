// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// This is our simple, in-memory "database" for active orders for now.
let activeOrders = [];

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000", // Allow our Next.js client to connect
      methods: ["GET", "POST"]
    }
  });

  // This runs when a new client (browser tab) connects to our server
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // When a client first connects, send them the current list of orders
    socket.emit("initial_orders", activeOrders);

    // This listens for an event from a customer placing an order
    socket.on("place_order", (newOrder) => {
      activeOrders.push(newOrder);
      // Now, broadcast the ENTIRE updated list to ALL connected clients
      io.emit("new_order_received", activeOrders);
    });

    // This listens for a waiter completing an order
    socket.on("complete_order", (orderId) => {
      activeOrders = activeOrders.filter(order => order.id !== orderId);
      // Broadcast the updated list to everyone
      io.emit("new_order_received", activeOrders);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});