

import { Request, Response } from 'express';
import User from '../models/user.model';
import jwt from 'jsonwebtoken';

// Helper to generate JWT
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
    const { name, email, phoneNumber, communityUnit, password, mygateId } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const user = await User.create({
            name,
            email,
            phoneNumber,
            communityUnit,
            password,
            mygateId, // Added mygateId to the creation object
        });

        if (user) {
             // We don't return a token on registration, as user needs admin approval
            res.status(201).json({
                message: "Registration successful. Please wait for admin approval."
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: (error as Error).message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password'); // Explicitly include password for comparison

        if (user && user.matchPassword && (await user.matchPassword(password))) {
            // Check for approval and active status
            if (!user.isApproved) {
                res.status(403).json({ message: 'Your account is pending admin approval.' });
                return;
            }
            if (!user.isActive) {
                res.status(403).json({ message: 'Your account is currently deactivated.' });
                return;
            }

            // Return user data and token
            res.json({
                ...user.toObject(),
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: (error as Error).message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};
