
import { Router } from 'express';
import {
    requestBook,
    approveRequest,
    rejectRequest,
    cancelRequest,
    confirmPickup,
    markAsReturned,
    revokeApproval
} from '../controllers/transaction.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All transaction routes are protected
router.use(protect);

router.post('/request/:id', requestBook);
router.post('/approve/:id', approveRequest);
router.post('/reject/:id', rejectRequest);
router.post('/cancel/:id', cancelRequest);
router.post('/revoke/:id', revokeApproval);
router.post('/pickup/:id', confirmPickup);
router.post('/return/:id', markAsReturned);

export default router;
