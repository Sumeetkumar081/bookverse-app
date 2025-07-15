
import Notification, { INotification } from '../models/notification.model';

// The type for the creation data will be Omit<INotification, 'id' | 'timestamp' | 'isRead'>
// but simplified here for clarity.
type NotificationCreationData = {
    userId: string;
    type: string;
    message: string;
    bookId?: string;
    relatedUserId?: string;
    chatSessionId?: string;
}

export const notificationService = {
  createNotification: async (data: NotificationCreationData): Promise<INotification> => {
    try {
      const notification = new Notification({
        ...data,
        timestamp: Date.now(),
        isRead: false,
      });
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      // Depending on requirements, we might want to throw the error
      // to be handled by the calling function.
      throw new Error('Failed to create notification.');
    }
  },
};
