
import dotenv from 'dotenv';
// Load environment variables IMMEDIATELY from the .env file.
// This must be done before any other application files are imported.
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import connectDB from './config/database';
import bookRoutes from './routes/book.routes';
import userRoutes from './routes/user.routes';
import transactionRoutes from './routes/transaction.routes';
import feedbackRoutes from './routes/feedback.routes';
import chatRoutes from './routes/chat.routes';
import kpiRoutes from './routes/kpi.routes';
import { socketProtect } from './middleware/auth.middleware';
import ChatSession from './models/chatSession.model';
import ChatMessage from './models/chatMessage.model';
import mongoose from 'mongoose';

// Check for essential environment variables (now that they are loaded)
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please add it to your .env file.');
  throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}
if (!process.env.GOOGLE_BOOKS_API_KEY) {
  console.warn('!!! WARNING: GOOGLE_BOOKS_API_KEY is not defined. Book search via Google Books will not work.');
}

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // In a real production app, lock this down to your frontend's URL
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 8080;

// --- CORRECT MIDDLEWARE ORDER ---
app.use(cors()); 
app.use(express.json() as express.RequestHandler);
app.use(express.urlencoded({ extended: true }) as express.RequestHandler);

// --- API ROUTES ---
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/kpis', kpiRoutes);


// --- SOCKET.IO REAL-TIME LOGIC ---
io.use(socketProtect); // Use authentication middleware for all socket connections

io.on('connection', (socket: Socket) => {
  if (!socket.user) return; // Should be protected by middleware
  console.log(`User connected: ${socket.id}, User ID: ${socket.user?.id}`);

  // Have user join a room identified by their own user ID for direct notifications
  socket.join(`user_${socket.user.id}`);
  
  // Handler for when a client wants to join a specific chat room
  socket.on('join_session', (sessionId: string) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined session room: ${sessionId}`);
  });
  
  // Handler for when a client sends a message
  socket.on('send_message', async ({ sessionId, messageText }: { sessionId: string; messageText: string; }) => {
    if (!socket.user) return; // Should be protected by middleware

    try {
      const session = await ChatSession.findById(sessionId);
      if (!session || !session.participantIds.some(id => id.equals(socket.user!.id))) {
        socket.emit('chat_error', { message: 'Not authorized to send message in this chat.' });
        return;
      }

      const receiverId = session.participantIds.find(id => !id.equals(socket.user!.id));
      if (!receiverId) return;

      const timestamp = Date.now();
      const message = await ChatMessage.create({
        sessionId: new mongoose.Types.ObjectId(sessionId),
        senderId: new mongoose.Types.ObjectId(socket.user.id),
        receiverId,
        messageText,
        timestamp,
      });

      // Update the session's last message details
      session.lastMessageText = messageText;
      session.lastMessageTimestamp = timestamp;

      // Increment unread count for the receiver
      const unreadCountUpdate = session.unreadCounts.find(uc => uc.userId.equals(receiverId));
      if(unreadCountUpdate) {
        unreadCountUpdate.count += 1;
      }
      
      await session.save();

      // Create a payload that includes the sender's name
      const messagePayload = {
          ...message.toObject(),
          senderName: socket.user.name
      };

      // Broadcast the newly created message with sender's name to all clients in the room
      io.to(sessionId).emit('new_message', messagePayload);
      
      // Also emit an update to the receiver's personal room to update their session list in real-time
      const updatedSessionForReceiver = await ChatSession.findById(sessionId).populate('participantIds', 'name communityUnit');
      io.to(`user_${receiverId.toString()}`).emit('session_updated', updatedSessionForReceiver);

    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit('chat_error', { message: 'Failed to send message.' });
    }
  });

  // Handler for when a user reads a chat
  socket.on('mark_chat_read', async (sessionId: string) => {
    if (!socket.user) return;
    try {
        await ChatSession.updateOne(
            { _id: sessionId, 'unreadCounts.userId': socket.user.id },
            { $set: { 'unreadCounts.$.count': 0 } }
        );
    } catch (error) {
        console.error('Error marking chat as read:', error);
    }
  });

  socket.on('disconnect', () => {
    if (socket.user) {
        console.log(`User disconnected: ${socket.id}, User ID: ${socket.user.id}`);
    } else {
        console.log(`User disconnected: ${socket.id}`);
    }
  });
});


// --- DATABASE & SERVER START ---
const startServer = async () => {
  await connectDB();

  httpServer.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
};

startServer().catch(err => {
    console.error('Failed to start server:', err);
    throw err;
});
