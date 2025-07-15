
import { Request, Response } from 'express';
import Book, { IBook } from '../models/book.model';
import User from '../models/user.model';
import mongoose from 'mongoose';
import { notificationService } from '../services/notificationService';

// Helper function to handle validation errors
const handleValidationError = (error: mongoose.Error.ValidationError, res: Response) => {
    const errors: { [key: string]: string } = {};
    for (const field in error.errors) {
        errors[field] = error.errors[field].message;
    }
    return res.status(400).json({
        message: 'Validation failed. Please check your input.',
        details: errors
    });
};


// @desc    Get books with filtering, sorting, and pagination
// @route   GET /api/books
// @access  Private
export const getAllBooks = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    const userId = req.user.id;

    if (req.query.viewContext === 'activity') {
        // For activity views, fetch all books where the current user is part of a transaction.
        query.$or = [
            { requestedByUserId: userId },
            { borrowedByUserId: userId },
            {
                ownerId: userId,
                borrowRequestStatus: { $in: ['pending', 'approved', 'pickup_confirmed', 'returned', 'giveaway_completed'] }
            }
        ];
    } else {
        // Community and My Collection view logic
        if (req.query.ownerId) {
            // This is for viewing a specific user's collection (usually "My Collection")
            query.ownerId = req.query.ownerId;
            if (req.query.myCollectionStatus) {
                switch(req.query.myCollectionStatus) {
                    case 'available':
                        query.isPausedByOwner = { $ne: true };
                        query.borrowRequestStatus = { $in: [null, 'returned', 'rejected', 'cancelled'] };
                        break;
                    case 'on_loan':
                        query.borrowRequestStatus = { $in: ['pending', 'approved', 'pickup_confirmed'] };
                        break;
                    case 'paused':
                        query.isPausedByOwner = true;
                        break;
                }
            }
        } else {
            // This is for the main Community View
            // Hide books owned by the current user
            if (req.user) {
                query.ownerId = { $ne: req.user.id };
            }

            // Community-specific filters
            if (req.query.availability) {
                if (req.query.availability === 'available') {
                    query.isAvailable = true;
                    query.isPausedByOwner = false;
                    query.isDeactivatedByAdmin = false;
                    query.borrowRequestStatus = { $in: [null, 'returned', 'rejected', 'cancelled'] };
                } else if (req.query.availability === 'unavailable') {
                     query.borrowRequestStatus = { $in: ['pending', 'approved', 'pickup_confirmed'] };
                }
            }
            if (req.query.giveawayOnly === 'true') {
                query.isGiveaway = true;
                query.borrowRequestStatus = { $in: [null, 'returned', 'rejected', 'cancelled'] };
            }
        }

        // Common filters for both community and my collection
        if (req.query.genre && req.query.genre !== 'all') query.genre = req.query.genre;
        if (req.query.language && req.query.language !== 'all') query.language = req.query.language;
        if (req.query.bookIds) {
            const bookIds = (req.query.bookIds as string).split(',');
            query._id = { $in: bookIds };
        }
        if (req.query.term) {
            const term = req.query.term as string;
            query.$or = [
                { title: { $regex: term, $options: 'i' } },
                { author: { $regex: term, $options: 'i' } },
            ];
        }
    }


    // Sorting
    const sort: any = {};
    const sortOrder = req.query.sortOrder as string;
    if (sortOrder) {
        const [field, order] = sortOrder.split('_');
        sort[field === 'date' ? 'dateAdded' : field] = order === 'desc' ? -1 : 1;
    } else {
        sort.dateAdded = -1; // Default sort
    }

    try {
        const books = await Book.find(query).sort(sort).skip(skip).limit(limit);
        const totalBooks = await Book.countDocuments(query);
        const totalPages = Math.ceil(totalBooks / limit);

        res.status(200).json({
            books,
            page,
            totalPages,
            totalBooks
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching books', error: (error as Error).message });
    }
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private
export const createBook = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    try {
        const newBook = new Book({
            ...req.body,
            ownerId: req.user.id, // Associate book with the logged-in user
            dateAdded: Date.now(),
        });
        const savedBook = await newBook.save();
        return res.status(201).json(savedBook);
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return handleValidationError(error, res);
        }
        return res.status(400).json({ message: 'Error creating book', error: (error as Error).message });
    }
};

// @desc    Update a book by ID
// @route   PUT /api/books/:id
// @access  Private (Owner only)
export const updateBook = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Authorization check: only the owner can update the book
        if (book.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'User not authorized to update this book' });
        }

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        return res.status(200).json(updatedBook);

    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return handleValidationError(error, res);
        }
        return res.status(400).json({ message: 'Error updating book', error: (error as Error).message });
    }
};

// @desc    Delete a book by ID
// @route   DELETE /api/books/:id
// @access  Private (Owner only)
export const deleteBook = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Authorization check
        if (book.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'User not authorized to delete this book' });
        }
        
        await book.deleteOne();
        return res.status(200).json({ message: 'Book deleted successfully' });

    } catch (error) {
        return res.status(500).json({ message: 'Error deleting book', error: (error as Error).message });
    }
};

// @desc    Get a single book by ID
// @route   GET /api/books/:id
// @access  Private
export const getBookById = async (req: Request, res: Response) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid book ID format' });
        }
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        return res.status(200).json(book);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching book', error: (error as Error).message });
    }
};

// @desc    Report a book
// @route   POST /api/books/:id/report
// @access  Private
export const reportBook = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'A reason for reporting is required.' });

    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        book.isReportedForReview = true;
        book.adminReviewRequestedTimestamp = Date.now();
        
        // Add reporter info to the list
        if (!book.reportedByUsers) {
            book.reportedByUsers = [];
        }
        book.reportedByUsers.push({
            userId: req.user.id,
            timestamp: Date.now(),
            reason
        });
        
        await book.save();
        res.status(200).json({ message: 'Book reported successfully. An admin will review it shortly.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error reporting book', error: (error as Error).message });
    }
};

// @desc    Search Google Books API
// @route   GET /api/books/google-search
// @access  Private
export const searchGoogleBooks = async (req: Request, res: Response) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: 'Search query (q) is required.' });
    }
    if (!process.env.GOOGLE_BOOKS_API_KEY) {
        return res.status(500).json({ message: 'Google Books API key is not configured on the server.' });
    }

    // This is a workaround for local development environments with SSL/TLS interception (e.g., corporate proxies)
    // that cause 'self-signed certificate in certificate chain' errors.
    // It temporarily disables strict SSL certificate validation for this specific API call.
    // This is insecure and should NOT be used in a production environment.
    const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    try {
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q as string)}&maxResults=10&key=${apiKey}`;
        
        const apiResponse = await fetch(url);
        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("Google Books API Error:", data);
            throw new Error(data.error?.message || 'Failed to fetch from Google Books API');
        }
        
        // We only want to send back the `items` array to the frontend.
        res.status(200).json(data.items || []);

    } catch (error) {
        console.error("Error in searchGoogleBooks:", error);
        res.status(500).json({ message: 'Error searching Google Books', error: (error as Error).message });
    } finally {
        // Restore the original setting after the API call is complete.
        if (process.env.NODE_ENV !== 'production') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        }
    }
};


// --- ADMIN BOOK CONTROLLERS ---

// @desc    Get books for moderation queue
// @route   GET /api/books/admin/moderation
// @access  Admin
export const getModerationQueue = async (req: Request, res: Response) => {
    const { status = 'reported' } = req.query; // 'reported' or 'deactivated'
    
    const query: any = {};
    if (status === 'reported') {
        query.isReportedForReview = true;
        query.isDeactivatedByAdmin = { $ne: true };
    } else if (status === 'deactivated') {
        query.isDeactivatedByAdmin = true;
    } else {
        return res.status(400).json({ message: "Invalid status query parameter."});
    }

    try {
        const books = await Book.find(query).sort({ adminReviewRequestedTimestamp: -1 });
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching moderation queue', error: (error as Error).message });
    }
};

// @desc    Admin deactivates a book
// @route   POST /api/books/admin/:bookId/deactivate
// @access  Admin
export const deactivateBook = async (req: Request, res: Response) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.bookId, { isDeactivatedByAdmin: true }, { new: true });
        if (!book) return res.status(404).json({ message: 'Book not found' });
        
        const owner = await User.findById(book.ownerId);
        if (owner) {
             await notificationService.createNotification({
                userId: owner.id,
                type: 'book_deactivated_by_admin_to_owner',
                message: `An admin has deactivated your book listing for '${book.title}' pending review.`,
                bookId: book.id
            });
        }
        
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Server error deactivating book', error: (error as Error).message });
    }
};

// @desc    Admin reactivates a book
// @route   POST /api/books/admin/:bookId/reactivate
// @access  Admin
export const reactivateBook = async (req: Request, res: Response) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.bookId, 
            { isDeactivatedByAdmin: false, isReportedForReview: false, reportedByUsers: [] }, 
            { new: true }
        );
        if (!book) return res.status(404).json({ message: 'Book not found' });
        
        const owner = await User.findById(book.ownerId);
        if (owner) {
             await notificationService.createNotification({
                userId: owner.id,
                type: 'book_reactivated_by_admin_to_owner',
                message: `An admin has reactivated your book listing for '${book.title}'.`,
                bookId: book.id
            });
        }
        
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Server error reactivating book', error: (error as Error).message });
    }
};

// @desc    Admin dismisses a report on a book
// @route   POST /api/books/admin/:bookId/dismiss-report
// @access  Admin
export const dismissReport = async (req: Request, res: Response) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.bookId, 
            { isReportedForReview: false }, 
            { new: true }
        );
        if (!book) return res.status(404).json({ message: 'Book not found' });
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Server error dismissing report', error: (error as Error).message });
    }
};
