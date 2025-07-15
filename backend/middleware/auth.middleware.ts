

import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../src/models/user.model';
import { Document } from 'mongoose';

// Extend Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: (IUser & Document) | null;
    }
  }
}

const protect = async (req: any, res: any, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return;
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

const adminProtect = (req: any, res: any, next: NextFunction) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};


export { protect, adminProtect };