// // backend/server.js
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./src/config/db');
// const path = require('path');

// const app = express();

// // connect DB
// connectDB();

// // middleware
// app.use(cors());
// app.use(express.json());

// // static uploads (if used)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // routes
// app.use('/api/applications', require('./src/routes/applicationRoutes'));
// app.use('/api/documents', require('./src/routes/documentRoutes'));
// app.use('/api/users', require('./src/routes/userRoutes'));
// app.use('/api/notifications', require('./src/routes/notificationRoutes'));
// app.use('/api/support', require('./src/routes/supportRoutes'));


// // health
// app.get('/api/health', (req, res) => res.json({ ok: true }));

// // error handler
// app.use((err, req, res, next) => {
//   console.error(err);
//   res.status(err.status || 500).json({ error: err.message || 'Server Error' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



// backend/server.js
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const connectDB = require('./src/config/db'); // adjust path if different

// const authMiddleware = require('./src/middleware/authMiddleware'); // new middleware
// const userRoutes = require('./src/routes/userRoutes');
// const applicationRoutes = require('./src/routes/applicationRoutes');
// const documentRoutes = require('./src/routes/documentRoutes');
// const notificationRoutes = require('./src/routes/notificationRoutes');
// const supportRoutes = require('./src/routes/supportRoutes');
// const reportRoutes = require("./src/routes/reportRoutes");

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // connect DB
// connectDB()

// // serve uploaded files folder (adjust folder name if needed)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // mount routes
// // Protect routes that need authentication by applying authMiddleware
// app.use('/api/users', authMiddleware, userRoutes);
// app.use('/api/applications', authMiddleware, applicationRoutes);
// app.use('/api/documents', authMiddleware, documentRoutes);
// app.use('/api/notifications', authMiddleware, notificationRoutes);
// // support may be public or protected; if you want it protected, add the middleware
// app.use('/api/support', authMiddleware, supportRoutes);
// app.use("/api/reports", reportRoutes);

// // a small debug endpoint (optional)
// app.get('/api/debug/me', authMiddleware, (req, res) => res.json({ me: req.user }));

// // generic error handler
// app.use((err, req, res, next) => {
//   console.error('Unhandled error:', err);
//   res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const http = require("http");
const { Server } = require("socket.io");

const userRoutes = require('./src/routes/userRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const supportRoutes = require('./src/routes/supportRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const authRoutes = require("./src/routes/authRoutes");



const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);

/* ---------- SOCKET.IO ---------- */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// in-memory chat store (for demo)
// later you can move this to MongoDB
const chats = {};

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
    socket.emit("chat_history", chats[roomId] || []);
  });

  socket.on("send_message", ({ roomId, sender, message }) => {
  const msg = {
    roomId,
    sender,
    message,
    time: new Date().toISOString(),
  };

  if (!chats[roomId]) chats[roomId] = [];
  chats[roomId].push(msg);

  // 1️⃣ Send to chat room (applicant + admin when joined)
  io.to(roomId).emit("receive_message", msg);

  // 2️⃣ Notify admins (VERY IMPORTANT)
  io.emit("admin_notify", msg);
});




  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});


// connect DB
connectDB();
// serve uploads securely (NOT public browsing)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/auth", authRoutes);

// mount routes (NO AUTH HERE)
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reports', reportRoutes);

// health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running with sockets on port ${PORT}`)
);

