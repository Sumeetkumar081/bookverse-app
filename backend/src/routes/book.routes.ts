
import { Router } from 'express';
import {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    reportBook,
    getModerationQueue,
    deactivateBook,
    reactivateBook,
    dismissReport,
    searchGoogleBooks
} from '../controllers/book.controller';
import { protect, adminProtect } from '../middleware/auth.middleware';

const router = Router();

// Protect all book routes
router.use(protect);

// Route for searching Google Books securely via backend
router.get('/google-search', searchGoogleBooks);

// Route for getting all books and creating a new book
router.route('/')
    .get(getAllBooks)
    .post(createBook);

// Route for getting, updating, and deleting a single book by its ID
router.route('/:id')
    .get(getBookById)
    .put(updateBook)
    .delete(deleteBook);

// Route for a user to report a book
router.post('/:id/report', reportBook);

// --- ADMIN ONLY ROUTES ---
router.get('/admin/moderation', adminProtect, getModerationQueue);
router.post('/admin/:bookId/deactivate', adminProtect, deactivateBook);
router.post('/admin/:bookId/reactivate', adminProtect, reactivateBook);
router.post('/admin/:bookId/dismiss-report', adminProtect, dismissReport);


export default router;