
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/user.model';
import { Document } from 'mongoose';
import { Socket } from 'socket.io';

// --- TYPE AUGMENTATION ---
// This is where we add custom properties to existing library types.
declare global {
  namespace Express {
    interface Request {
      // Add the user property to Express's Request object
      user?: (IUser & Document) | null;
    }
  }
}

// Augment the Socket.IO Socket interface
declare module 'socket.io' {
    interface Socket {
        // Add the user property to Socket.IO's Socket object
        user?: (IUser & Document) | null;
    }
}


// --- MIDDLEWARE ---

/**
 * Middleware to protect standard HTTP routes.
 * Verifies JWT from 'Authorization' header.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Middleware for standard HTTP routes to ensure user is an admin.
 * Must be used AFTER `protect`.
 */
export const adminProtect = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

/**
 * Middleware to protect Socket.IO connections.
 * Verifies JWT from the socket's handshake authentication object.
 */
export const socketProtect = async (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided.'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new Error('Authentication error: User not found.'));
        }
        socket.user = user; // Attach user to the socket object
        next();
    } catch (error) {
        return next(new Error('Authentication error: Token is invalid.'));
    }
};