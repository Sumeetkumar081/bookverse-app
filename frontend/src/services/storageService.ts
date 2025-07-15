
import { User, Book, Notification, Feedback, ChatSession, ChatMessage } from '../types';
import { BOOK_LANGUAGES } from '../constants';

const USERS_KEY = 'communityBookShare_users';
const BOOKS_KEY = 'communityBookShare_books';
const NOTIFICATIONS_KEY = 'communityBookShare_notifications';
const FEEDBACK_KEY = 'communityBookShare_feedback';
const CHAT_SESSIONS_KEY = 'communityBookShare_chatSessions';
const CHAT_MESSAGES_KEY = 'communityBookShare_chatMessages';
const PENDING_DIGEST_KEY = 'communityBookShare_pendingDigest';


const DEFAULT_MOCK_EMAIL = 'sumeetkumar081@gmail.com';
const DEFAULT_LANGUAGE = BOOK_LANGUAGES.find(lang => lang === "English") || BOOK_LANGUAGES[1] || "Others";


export const storageService = {
  getUsers: (): User[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    if (usersJson) {
      const parsedUsers = JSON.parse(usersJson) as User[];
      return parsedUsers.map(user => ({
        ...user,
        email: user.email || DEFAULT_MOCK_EMAIL, 
        password: user.password || 'password', // Add mock password for login
        isApproved: user.isApproved === undefined ? true : user.isApproved, // Default existing users to approved
        mygateId: user.mygateId || (user.isAdmin ? 'N/A' : '000000'), // Default MyGate ID
        emailOptOut: user.emailOptOut === undefined ? false : user.emailOptOut, 
        isActive: user.isActive === undefined ? true : user.isActive,
        wishlistBookIds: user.wishlistBookIds || [], // Initialize wishlist
      }));
    }
    return [];
  },
  saveUsers: (users: User[]): void => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users.map(user => ({
        ...user,
        email: user.email || DEFAULT_MOCK_EMAIL,
        password: user.password || 'password',
        isApproved: user.isApproved === undefined ? true : user.isApproved,
        mygateId: user.mygateId || (user.isAdmin ? 'N/A' : '000000'),
        emailOptOut: user.emailOptOut === undefined ? false : user.emailOptOut,
        isActive: user.isActive === undefined ? true : user.isActive,
        wishlistBookIds: user.wishlistBookIds || [],
    }))));
  },
  getBooks: (): Book[] => {
    const booksJson = localStorage.getItem(BOOKS_KEY);
    if (booksJson) {
        const parsedBooks = JSON.parse(booksJson) as Book[];
        return parsedBooks.map(book => ({
            ...book,
            genre: book.genre || "General Fiction", 
            isGiveaway: book.isGiveaway === undefined ? false : book.isGiveaway,
            isPausedByOwner: book.isPausedByOwner === undefined ? false : book.isPausedByOwner,
            language: book.language || DEFAULT_LANGUAGE, // Default language
            dateAdded: book.dateAdded || Date.now(), // Default dateAdded to now if not present
        }));
    }
    return [];
  },
  saveBooks: (books: Book[]): void => {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  },
  getNotifications: (): Notification[] => {
    const notificationsJson = localStorage.getItem(NOTIFICATIONS_KEY);
    if (notificationsJson) {
      const parsedNotifications = JSON.parse(notificationsJson) as Notification[];
      return parsedNotifications.map(notif => ({
        ...notif,
        isRead: notif.isRead === undefined ? false : notif.isRead,
      }));
    }
    return [];
  },
  saveNotifications: (notifications: Notification[]): void => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  },
  getFeedback: (): Feedback[] => {
    const feedbackJson = localStorage.getItem(FEEDBACK_KEY);
    return feedbackJson ? JSON.parse(feedbackJson) : [];
  },
  saveFeedback: (feedback: Feedback[]): void => {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
  },

  // Chat Storage
  getChatSessions: (): ChatSession[] => {
    const sessionsJson = localStorage.getItem(CHAT_SESSIONS_KEY);
    return sessionsJson ? JSON.parse(sessionsJson) : [];
  },
  saveChatSessions: (sessions: ChatSession[]): void => {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  },
  getChatMessages: (): ChatMessage[] => {
    const messagesJson = localStorage.getItem(CHAT_MESSAGES_KEY);
    return messagesJson ? JSON.parse(messagesJson) : [];
  },
  saveChatMessages: (messages: ChatMessage[]): void => {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  },

  // Daily Digest
  getPendingDigestBookIds: (): string[] => {
    const idsJson = localStorage.getItem(PENDING_DIGEST_KEY);
    return idsJson ? JSON.parse(idsJson) : [];
  },
  savePendingDigestBookIds: (bookIds: string[]): void => {
    localStorage.setItem(PENDING_DIGEST_KEY, JSON.stringify(bookIds));
  },
};
