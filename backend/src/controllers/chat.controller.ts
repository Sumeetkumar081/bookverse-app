
import { Request, Response } from 'express';
import ChatSession from '../models/chatSession.model';
import ChatMessage from '../models/chatMessage.model';
import mongoose from 'mongoose';

// @desc    Initiate or get an existing chat session between two users
// @route   POST /api/chat/initiate
// @access  Private
export const initiateChat = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const { otherUserId } = req.body;
    if (!otherUserId) {
        return res.status(400).json({ message: 'Other user ID is required.' });
    }

    const currentUserId = req.user.id;
    // Sort IDs to ensure consistency for the unique index
    const participantIds = [new mongoose.Types.ObjectId(currentUserId), new mongoose.Types.ObjectId(otherUserId)].sort();

    try {
        let session = await ChatSession.findOne({
            participantIds: { $all: participantIds, $size: 2 }
        });

        if (!session) {
            session = await ChatSession.create({
                participantIds,
                lastMessageTimestamp: Date.now(),
                unreadCounts: [
                    { userId: participantIds[0], count: 0 },
                    { userId: participantIds[1], count: 0 }
                ]
            });
        }

        const populatedSession = await ChatSession.findById(session.id).populate('participantIds', 'name communityUnit email');

        res.status(200).json(populatedSession);
    } catch (error) {
        res.status(500).json({ message: 'Server error initiating chat', error: (error as Error).message });
    }
};

// @desc    Get all chat sessions for a user
// @route   GET /api/chat/sessions
// @access  Private
export const getChatSessions = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    try {
        const sessions = await ChatSession.find({ participantIds: req.user._id })
            .populate('participantIds', 'name communityUnit')
            .sort({ lastMessageTimestamp: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching chat sessions', error: (error as Error).message });
    }
};

// @desc    Get all messages for a specific session from the last 7 days
// @route   GET /api/chat/sessions/:sessionId/messages
// @access  Private
export const getChatMessages = async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    try {
        const { sessionId } = req.params;
        
        const session = await ChatSession.findById(sessionId);
        if (!session || !session.participantIds.some(id => id.equals(req.user!.id))) {
            return res.status(403).json({ message: 'Not authorized to view this chat' });
        }

        // Fetch messages from the last 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const messages = await ChatMessage.find({ 
            sessionId,
            timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: 1 });
        
        // When user fetches messages, mark their unread count as 0
        await ChatSession.updateOne(
            { _id: sessionId, 'unreadCounts.userId': req.user.id },
            { $set: { 'unreadCounts.$.count': 0 } }
        );

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching messages', error: (error as Error).message });
    }
};
