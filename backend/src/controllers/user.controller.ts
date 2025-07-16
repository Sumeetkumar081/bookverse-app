

import { Request, Response } from 'express';
import User from '../models/user.model';
import Book from '../models/book.model';
import Notification from '../models/notification.model';
import jwt from 'jsonwebtoken';
import { emailService } from '../services/emailService';
import { notificationService } from '../services/notificationService';
import crypto from 'crypto';

// Helper to generate JWT
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '365d', // Token expires in 1 year
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req: any, res: any) => {
    const { name, email, phoneNumber, communityUnit, password, mygateId } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const user = await User.create({
            name, email, phoneNumber, communityUnit, password, mygateId
        });

        if (user) {
            // Notify admins of new registration
            const admins = await User.find({ isAdmin: true });
            for (const admin of admins) {
                await notificationService.createNotification({
                    userId: admin.id,
                    type: 'new_user_registered_for_admin',
                    message: `New user '${name}' (${communityUnit}) has registered and is awaiting approval.`
                });
            }
            res.status(201).json({ message: "Registration successful. Please wait for admin approval." });
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
export const loginUser = async (req: any, res: any) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && user.matchPassword && (await user.matchPassword(password))) {
            if (!user.isApproved) {
                return res.status(403).json({ message: 'Your account is pending admin approval.' });
            }
            if (user.deactivatedByAdmin) {
                 return res.status(403).json({ message: 'Your account has been deactivated by an administrator.' });
            }
            if (!user.isActive) {
                return res.status(403).json({ 
                    message: 'Your account is currently self-deactivated.',
                    reactivationPossible: true 
                });
            }

            res.json({ ...user.toObject(), token: generateToken(user._id.toString()) });
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
export const getUserProfile = async (req: any, res: any) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = req.body.name || user.name;
        user.emailOptOut = req.body.emailOptOut !== undefined ? req.body.emailOptOut : user.emailOptOut;

        const updatedUser = await user.save();
        res.json(updatedUser.toObject());
    } catch (error) {
        res.status(500).json({ message: 'Server error updating profile', error: (error as Error).message });
    }
};

// @desc    User deactivates their own account
// @route   POST /api/users/profile/deactivate
// @access  Private
export const deactivateUser = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    try {
        const userId = req.user.id;
        const activeTransactions = await Book.countDocuments({
            $or: [{ ownerId: userId, borrowedByUserId: { $exists: true } }, { borrowedByUserId: userId }]
        });
        if (activeTransactions > 0) {
            return res.status(400).json({ message: 'You cannot deactivate your account while you have active book transactions. Please resolve all lent and borrowed books first.' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isActive = false;
        await user.save();
        res.json({ message: 'Account deactivated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deactivating account', error: (error as Error).message });
    }
};

// @desc    User requests reactivation from an admin
// @route   POST /api/users/profile/reactivate-request
// @access  Public (for deactivated users trying to log in)
export const requestReactivation = async (req: any, res: any) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isActive && !user.deactivatedByAdmin) return res.status(400).json({ message: 'Account is already active.' });

        user.reactivationRequested = true;
        user.reactivationRequestTimestamp = Date.now();
        await user.save();

        // Notify admins
        const admins = await User.find({ isAdmin: true });
        for (const admin of admins) {
            await notificationService.createNotification({
                userId: admin.id,
                type: 'user_requests_reactivation_to_admin',
                message: `User '${user.name}' (${user.communityUnit}) has requested to reactivate their account.`,
                relatedUserId: user.id
            });
        }
        res.json({ message: 'Reactivation request sent. An admin will review it shortly.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error requesting reactivation', error: (error as Error).message });
    }
};

// @desc    User deletes their own account
// @route   DELETE /api/users/profile
// @access  Private
export const deleteUser = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    try {
        const userId = req.user.id;
        const activeTransactions = await Book.countDocuments({
            $or: [{ ownerId: userId, borrowedByUserId: { $exists: true } }, { borrowedByUserId: userId }]
        });
        if (activeTransactions > 0) {
            return res.status(400).json({ message: 'You cannot delete your account while you have active book transactions.' });
        }

        // Delete user's books and notifications
        await Book.deleteMany({ ownerId: userId });
        await Notification.deleteMany({ userId: userId });
        // In a real app, also delete feedback, chat messages etc.
        
        await User.findByIdAndDelete(userId);
        res.json({ message: 'Account deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting account', error: (error as Error).message });
    }
};


// @desc    Get multiple users by their IDs
// @route   POST /api/users/by-ids
// @access  Private
export const getUsersByIds = async (req: any, res: any) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ message: 'User IDs must be provided as an array.' });
    
    const validUserIds = userIds.filter(id => typeof id === 'string');
    try {
        const users = await User.find({ '_id': { $in: validUserIds } }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users', error: (error as Error).message });
    }
};

// @desc    Toggle a book in user's wishlist
// @route   PUT /api/users/wishlist/:bookId
// @access  Private
export const toggleWishlist = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    try {
        const user = req.user;
        const bookId = req.params.bookId;
        const index = user.wishlistBookIds?.indexOf(bookId) ?? -1;
        let updatedUser;

        if (index > -1) {
            // Remove from wishlist
            user.wishlistBookIds?.splice(index, 1);
        } else {
            // Add to wishlist
            if (!user.wishlistBookIds) user.wishlistBookIds = [];
            user.wishlistBookIds.push(bookId);
        }
        
        updatedUser = await user.save();
        res.status(200).json(updatedUser.toObject());
    } catch (error) {
        res.status(500).json({ message: 'Server error updating wishlist', error: (error as Error).message });
    }
};

// @desc    Get books from user's wishlist
// @route   GET /api/users/wishlist-books
// @access  Private
export const getWishlistBooks = async (req: any, res: any) => {
    if (!req.user || !req.user.wishlistBookIds) return res.status(200).json([]);
    
    try {
        const books = await Book.find({ '_id': { $in: req.user.wishlistBookIds } });
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching wishlist books', error: (error as Error).message });
    }
};

// --- PASSWORD RESET ---
export const forgotPassword = async (req: any, res: any) => {
    // This flow is simplified for this environment. In a real app, you'd send an email with a link.
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User with that email does not exist.' });

        // Create reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // In a real app, send email
        await emailService.sendPasswordResetEmail(user, resetToken);
        
        res.json({ message: 'Password reset instructions have been sent to your email.' });
    } catch (error) {
         res.status(500).json({ message: 'Error on forgot password', error: (error as Error).message });
    }
};

export const resetPassword = async (req: any, res: any) => {
     // This flow is simplified.
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({ 
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+password');

        if (!user) return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error on reset password', error: (error as Error).message });
    }
};


// --- NOTIFICATION CONTROLLERS ---
export const getNotificationsForUser = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    try {
        const notifications = await Notification.find({ userId: req.user.id }).sort({ timestamp: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: (error as Error).message });
    }
};

export const markNotificationAsRead = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: (error as Error).message });
    }
};

export const markAllNotificationsAsRead = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    try {
        await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error: (error as Error).message });
    }
};


// --- ADMIN CONTROLLERS ---

// @desc    Get users pending approval
// @route   GET /api/users/admin/pending-approvals
// @access  Admin
export const getPendingApprovals = async (req: any, res: any) => {
    try {
        const users = await User.find({ isApproved: false }).sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Approve a user registration
// @route   POST /api/users/admin/approve/:userId
// @access  Admin
export const approveUser = async (req: any, res: any) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isApproved = true;
        await user.save();
        
        await emailService.sendRegistrationApprovedEmail(user);
        await notificationService.createNotification({
            userId: user.id,
            type: 'registration_approved_to_user',
            message: 'Welcome to BookVerse! Your registration has been approved. You can now log in.'
        });

        res.status(200).json({ message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Reject a user registration
// @route   POST /api/users/admin/reject/:userId
// @access  Admin
export const rejectUser = async (req: any, res: any) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await emailService.sendRegistrationRejectedEmail(user);
        await user.deleteOne();

        res.status(200).json({ message: 'User rejected and removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Get all users for management
// @route   GET /api/users/admin/users
// @access  Admin
export const getAllUsersForAdmin = async (req: any, res: any) => {
    try {
        const users = await User.find({ isAdmin: false }).sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Toggle a user's active status
// @route   POST /api/users/admin/toggle-activation/:userId
// @access  Admin
export const toggleUserActivation = async (req: any, res: any) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isActive = !user.isActive;
        user.deactivatedByAdmin = !user.isActive; // If we made them inactive, it was by an admin
        user.reactivationRequested = false; // Clear any pending request
        await user.save();
        
        await notificationService.createNotification({
            userId: user.id,
            type: user.isActive ? 'user_reactivated_by_admin' : 'user_deactivated_by_admin',
            message: `An administrator has ${user.isActive ? 'reactivated' : 'deactivated'} your account.`
        });

        res.status(200).json(user.toObject());
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Admin approves a reactivation request
// @route   POST /api/users/admin/reactivate/:userId
// @access  Admin
export const reactivateUser = async (req: any, res: any) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.isActive = true;
        user.deactivatedByAdmin = false;
        user.reactivationRequested = false;
        await user.save();
        
         await notificationService.createNotification({
            userId: user.id,
            type: 'reactivation_request_approved_to_user',
            message: `Your account reactivation request has been approved. You can now log in.`
        });
        
        res.status(200).json(user.toObject());
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};