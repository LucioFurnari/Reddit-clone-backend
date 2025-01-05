import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import subRedditRoutes from './routes/subreddit';
import voteRoutes from './routes/vote';
import postRoutes from './routes/post';
import commentRoutes from './routes/comment';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', subRedditRoutes);
app.use('/api', voteRoutes);
app.use('/api', postRoutes);
app.use('/api', commentRoutes);
app.use('/api', userRoutes);

// Create an HTTP server
const server = createServer(app);

// Initialize Socket.io
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET","POST"],
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle custom events here, e.g., joining rooms
  socket.on("join", (userId) => {
    console.log(`User ${userId} joined`);
    socket.join(`user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));