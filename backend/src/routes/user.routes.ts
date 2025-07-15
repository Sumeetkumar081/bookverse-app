
import { Router } from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    getUsersByIds,
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateUserProfile,
    deactivateUser,
    deleteUser,
    requestReactivation,
    toggleWishlist,
    getWishlistBooks,
    forgotPassword,
    resetPassword,
    getPendingApprovals,
    approveUser,
    rejectUser,
    getAllUsersForAdmin,
    toggleUserActivation,
    reactivateUser,
} from '../controllers/user.controller';
import { protect, adminProtect } from '../middleware/auth.middleware';

const router = Router();

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/profile/reactivate-request', requestReactivation); // User requests reactivation

// --- Protected User Routes ---
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile)
    .delete(protect, deleteUser);
    
router.post('/profile/deactivate', protect, deactivateUser);

router.post('/by-ids', protect, getUsersByIds);

// Wishlist routes
router.put('/wishlist/:bookId', protect, toggleWishlist);
router.get('/wishlist-books', protect, getWishlistBooks);

// Notification routes
router.get('/notifications', protect, getNotificationsForUser);
router.post('/notifications/read-all', protect, markAllNotificationsAsRead);
router.post('/notifications/:id/read', protect, markNotificationAsRead);


// --- Protected Admin Routes ---
router.get('/admin/pending-approvals', protect, adminProtect, getPendingApprovals);
router.post('/admin/approve/:userId', protect, adminProtect, approveUser);
router.post('/admin/reject/:userId', protect, adminProtect, rejectUser);
router.get('/admin/users', protect, adminProtect, getAllUsersForAdmin);
router.post('/admin/toggle-activation/:userId', protect, adminProtect, toggleUserActivation);
router.post('/admin/reactivate/:userId', protect, adminProtect, reactivateUser);


export default router;