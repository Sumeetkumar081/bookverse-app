
import { Request, Response } from 'express';
import Book from '../models/book.model';
import User from '../models/user.model';
import Kpi from '../models/kpi.model';
import { emailService } from '../services/emailService';
import { notificationService } from '../services/notificationService';
import mongoose from 'mongoose';

// @desc    Request to borrow a book
// @route   POST /api/transactions/request/:id
// @access  Private
export const requestBook = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }

    try {
        // Check if user has reached the request limit
        const userId = req.user.id;
        const activeTransactions = await Book.countDocuments({
            $or: [
                { requestedByUserId: userId, borrowRequestStatus: { $in: ['pending', 'approved'] } },
                { borrowedByUserId: userId, borrowRequestStatus: 'pickup_confirmed' }
            ]
        });

        if (activeTransactions >= 5) {
            return res.status(400).json({ message: 'You have reached the maximum limit of 5 active requests or borrowed books. Please return a book to request a new one.' });
        }

        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        if (book.ownerId.toString() === req.user.id) return res.status(400).json({ message: 'You cannot request your own book' });
        if (book.borrowRequestStatus && book.borrowRequestStatus !== 'returned' && book.borrowRequestStatus !== 'rejected' && book.borrowRequestStatus !== 'cancelled') {
            return res.status(400).json({ message: 'Book is not available for request' });
        }

        book.requestedByUserId = req.user.id;
        book.borrowRequestStatus = 'pending';
        book.requestedTimestamp = Date.now();
        const updatedBook = await book.save();
        
        // Notify owner
        const owner = await User.findById(book.ownerId);
        if(owner) {
            await emailService.sendBookRequestEmail(owner, req.user, book);
            await notificationService.createNotification({
                userId: owner.id,
                type: 'borrow_request_received',
                message: `${req.user.name} has requested to borrow '${book.title}'.`,
                bookId: book.id,
                relatedUserId: req.user.id,
            });
        }

        res.status(200).json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Approve a borrow request
// @route   POST /api/transactions/approve/:id
// @access  Private (Owner only)
export const approveRequest = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }

    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        if (book.ownerId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to approve this request' });
        if (book.borrowRequestStatus !== 'pending') return res.status(400).json({ message: 'No pending request to approve' });
        
        book.borrowRequestStatus = 'approved';
        book.decisionTimestamp = Date.now();
        const updatedBook = await book.save();

        // Notify requester
        const requester = await User.findById(book.requestedByUserId);
        if(requester) {
            await emailService.sendRequestApprovedEmail(requester, req.user, book);
             await notificationService.createNotification({
                userId: requester.id,
                type: 'borrow_request_approved',
                message: `${req.user.name} has approved your request for '${book.title}'. Please coordinate pickup.`,
                bookId: book.id,
                relatedUserId: req.user.id,
            });
        }
        
        res.status(200).json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Reject a borrow request
// @route   POST /api/transactions/reject/:id
// @access  Private (Owner only)
export const rejectRequest = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }

    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        if (book.ownerId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to reject this request' });
        if (book.borrowRequestStatus !== 'pending') return res.status(400).json({ message: 'No pending request to reject' });

        const requesterId = book.requestedByUserId;
        book.borrowRequestStatus = 'rejected';
        book.decisionTimestamp = Date.now();
        book.requestedByUserId = undefined; 
        book.requestedTimestamp = undefined;
        const updatedBook = await book.save();
        
        // Notify requester
        const requester = await User.findById(requesterId);
        if(requester) {
            await emailService.sendRequestRejectedEmail(requester, req.user, book);
             await notificationService.createNotification({
                userId: requester.id,
                type: 'borrow_request_rejected',
                message: `Your request for '${book.title}' was not approved at this time.`,
                bookId: book.id,
            });
        }

        res.status(200).json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Cancel a sent borrow request
// @route   POST /api/transactions/cancel/:id
// @access  Private (Requester only)
export const cancelRequest = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }

    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        if (book.requestedByUserId !== req.user.id) return res.status(403).json({ message: 'Not authorized to cancel this request' });
        if (book.borrowRequestStatus !== 'pending' && book.borrowRequestStatus !== 'approved') return res.status(400).json({ message: 'Request cannot be cancelled at this stage.' });
        
        const ownerId = book.ownerId;
        book.borrowRequestStatus = 'cancelled';
        book.decisionTimestamp = Date.now();
        book.requestedByUserId = undefined; 
        book.requestedTimestamp = undefined;
        const updatedBook = await book.save();

        // Notify owner that the request was cancelled
        const owner = await User.findById(ownerId);
        if(owner) {
            await notificationService.createNotification({
                userId: owner.id,
                type: 'borrow_request_cancelled',
                message: `${req.user.name} has cancelled their request for '${book.title}'.`,
                bookId: book.id,
                relatedUserId: req.user.id,
            });
        }
        
        res.status(200).json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Owner revokes an approval for a borrow request
// @route   POST /api/transactions/revoke/:id
// @access  Private (Owner only)
export const revokeApproval = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }

    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        if (book.ownerId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to revoke this approval' });
        if (book.borrowRequestStatus !== 'approved') return res.status(400).json({ message: 'No approved request to revoke' });

        const originalRequesterId = book.requestedByUserId;
        
        // Reset book state to be available again
        book.borrowRequestStatus = 'cancelled';
        book.requestedByUserId = undefined; 
        book.requestedTimestamp = undefined;
        book.decisionTimestamp = undefined;
        
        const updatedBook = await book.save();
        
        // Notify original requester
        if (originalRequesterId) {
            const requester = await User.findById(originalRequesterId);
            if (requester) {
                await notificationService.createNotification({
                    userId: requester.id,
                    type: 'approval_revoked_by_owner_to_requester',
                    message: `The owner has revoked their approval for '${book.title}'.`,
                    bookId: book.id,
                    relatedUserId: req.user.id,
                });
            }
        }

        res.status(200).json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: 'Server error revoking approval', error: (error as Error).message });
    }
};

// @desc    Confirm pickup of a book
// @route   POST /api/transactions/pickup/:id
// @access  Private (Requester only)
export const confirmPickup = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }

    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        if (book.requestedByUserId !== req.user.id) return res.status(403).json({ message: 'Not authorized to confirm pickup' });
        if (book.borrowRequestStatus !== 'approved') return res.status(400).json({ message: 'Book is not approved for pickup' });

        if (book.isGiveaway) {
            book.borrowRequestStatus = 'giveaway_completed';
            // Increment giveaway KPI
            await Kpi.findOneAndUpdate({ singleton: true }, { $inc: { totalGiveaways: 1 } }, { upsert: true });
        } else {
            book.borrowRequestStatus = 'pickup_confirmed';
        }
        
        book.borrowedByUserId = req.user.id;
        book.isAvailable = false;
        book.pickupTimestamp = Date.now();
        const updatedBook = await book.save();
        
        res.status(200).json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// @desc    Mark a book as returned
// @route   POST /api/transactions/return/:id
// @access  Private (Owner only)
export const markAsReturned = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }

    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        if (book.ownerId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to mark this book as returned' });
        if (book.borrowRequestStatus !== 'pickup_confirmed') return res.status(400).json({ message: 'Book is not currently borrowed' });

        const borrowerId = book.borrowedByUserId;
        book.borrowRequestStatus = 'returned';
        book.isAvailable = true;
        book.returnedTimestamp = Date.now();
        book.borrowedByUserId = undefined;
        book.requestedByUserId = undefined; 
        book.pickupTimestamp = undefined;
        book.decisionTimestamp = undefined;
        book.requestedTimestamp = undefined;
        const updatedBook = await book.save();
        
        // Notify former borrower
        const borrower = await User.findById(borrowerId);
        if(borrower) {
            await emailService.sendBookReturnedEmail(borrower, req.user, book);
             await notificationService.createNotification({
                userId: borrower.id,
                type: 'book_marked_returned',
                message: `'${book.title}' has been marked as returned by the owner.`,
                bookId: book.id,
            });
        }
        
        // Increment borrow KPI
        await Kpi.findOneAndUpdate({ singleton: true }, { $inc: { totalBooksBorrowed: 1 } }, { upsert: true });

        res.status(200).json(updatedBook);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};
