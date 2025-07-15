

import { Request, Response } from 'express';
import Feedback from '../models/feedback.model';
import { FeedbackStatus } from '../../../frontend/src/types';

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Private
export const submitFeedback = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const { subject, message } = req.body;
    if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required fields.' });
    }

    try {
        const feedback = await Feedback.create({
            userId: req.user.id,
            subject,
            message,
        });
        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Server error submitting feedback', error: (error as Error).message });
    }
};

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Admin
export const getFeedback = async (req: any, res: any) => {
    try {
        const allFeedback = await Feedback.find().sort({ timestamp: -1 });
        res.status(200).json(allFeedback);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching feedback', error: (error as Error).message });
    }
};

// @desc    Update feedback status
// @route   PUT /api/feedback/:feedbackId
// @access  Admin
export const updateFeedbackStatus = async (req: any, res: any) => {
    const { status } = req.body;
    const { feedbackId } = req.params;

    if (!status || !['new', 'read', 'for_later', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'A valid status is required.' });
    }

    try {
        const feedback = await Feedback.findByIdAndUpdate(feedbackId, { status }, { new: true });
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating feedback', error: (error as Error).message });
    }
};