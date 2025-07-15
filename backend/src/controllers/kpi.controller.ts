
import { Request, Response } from 'express';
import Kpi from '../models/kpi.model';
import Book from '../models/book.model';

// @desc    Get key performance indicators
// @route   GET /api/kpis
// @access  Admin
export const getKpis = async (req: Request, res: Response) => {
    try {
        // Fetch the counters document
        const kpiCounters = await Kpi.findOne({ singleton: true });

        // Calculate the total number of books on the platform
        // This includes all books except those that have been permanently given away.
        const totalBooksOnPlatform = await Book.countDocuments({
            borrowRequestStatus: { $ne: 'giveaway_completed' }
        });

        const response = {
            totalBooksOnPlatform,
            totalBorrowsAndGiveaways: (kpiCounters?.totalBooksBorrowed || 0) + (kpiCounters?.totalGiveaways || 0)
        };

        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({ message: 'Server error fetching KPIs', error: (error as Error).message });
    }
};
