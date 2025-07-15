
import { User, Book, PaginatedBooksResponse, Notification, Feedback, ChatSession, ChatMessage, FeedbackStatus, KpiData, GoogleBookSearchResult } from '../types';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const handleResponse = async (response: Response) => {
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    
    if (!response.ok) {
        const error: any = new Error(data.message || 'An unknown error occurred.');
        if (data.details) {
            error.details = data.details;
        }
        if (data.reactivationPossible) {
            error.reactivationPossible = data.reactivationPossible;
        }
        throw error;
    }
    return data;
};


export const apiService = {
    // --- AUTH ---
    register: async (userData: Partial<User>) => {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    login: async (email: string, password: string): Promise<User & { token: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return handleResponse(response);
    },
    
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return handleResponse(response);
    },
    
    requestReactivation: async (email: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/profile/reactivate-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return handleResponse(response);
    },

    // --- USER PROFILE ---
    getProfile: async (token: string): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return handleResponse(response);
    },
    
    updateProfile: async (token: string, profileData: Partial<User>): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        return handleResponse(response);
    },
    
    selfDeactivateAccount: async (token: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/profile/deactivate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    
    deleteProfile: async (token: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    getUsersByIds: async (token: string, userIds: string[]): Promise<User[]> => {
        const response = await fetch(`${API_BASE_URL}/users/by-ids`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userIds })
        });
        return handleResponse(response);
    },

    // --- WISHLIST ---
    toggleWishlist: async (token: string, bookId: string): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/wishlist/${bookId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    getWishlistBooks: async (token: string): Promise<Book[]> => {
        const response = await fetch(`${API_BASE_URL}/users/wishlist-books`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },


    // --- BOOKS ---
    searchBooks: async (token: string, filters: any): Promise<PaginatedBooksResponse> => {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '' && filters[key] !== 'all') {
                queryParams.append(key, filters[key]);
            }
        });
        const response = await fetch(`${API_BASE_URL}/books?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    searchGoogleBooks: async (token: string, query: string): Promise<GoogleBookSearchResult[]> => {
        const response = await fetch(`${API_BASE_URL}/books/google-search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    
    createBook: async (token: string, bookData: Partial<Book>): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(bookData)
        });
        return handleResponse(response);
    },
    
    updateBook: async (token: string, bookId: string, bookData: Partial<Book>): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(bookData)
        });
        return handleResponse(response);
    },
    
    deleteBook: async (token: string, bookId: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    
    reportBook: async (token: string, bookId: string, reason: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
        });
        return handleResponse(response);
    },

    togglePauseBook: async (token: string, bookId: string, isPaused: boolean): Promise<Book> => {
        return apiService.updateBook(token, bookId, { isPausedByOwner: isPaused });
    },

    // --- TRANSACTIONS ---
    requestBook: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/transactions/request/${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    approveRequest: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/transactions/approve/${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    rejectRequest: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/transactions/reject/${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    cancelRequest: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/transactions/cancel/${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    revokeApproval: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/transactions/revoke/${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    confirmPickup: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/transactions/pickup/${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
    markAsReturned: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/transactions/return/${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // --- FEEDBACK ---
    submitFeedback: async (token: string, subject: string, message: string): Promise<Feedback> => {
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subject, message })
        });
        return handleResponse(response);
    },

    // --- CHAT ---
    initiateChat: async (token: string, otherUserId: string): Promise<ChatSession> => {
        const response = await fetch(`${API_BASE_URL}/chat/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ otherUserId })
        });
        return handleResponse(response);
    },

    getChatSessions: async (token: string): Promise<ChatSession[]> => {
        const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    getChatMessages: async (token: string, sessionId: string): Promise<ChatMessage[]> => {
        const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // --- NOTIFICATIONS ---
    getNotifications: async (token: string): Promise<Notification[]> => {
        const response = await fetch(`${API_BASE_URL}/users/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    markNotificationAsRead: async (token: string, notificationId: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    markAllNotificationsAsRead: async (token: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/notifications/read-all`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // --- ADMIN ---
    adminGetPendingUsers: async (token: string): Promise<User[]> => {
        const response = await fetch(`${API_BASE_URL}/users/admin/pending-approvals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminGetAllUsers: async (token: string): Promise<User[]> => {
        const response = await fetch(`${API_BASE_URL}/users/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminApproveUser: async (token: string, userId: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/admin/approve/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminRejectUser: async (token: string, userId: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/admin/reject/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminToggleUserActivation: async (token: string, userId: string): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/admin/toggle-activation/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminGetModerationBooks: async (token: string, status: 'reported' | 'deactivated'): Promise<Book[]> => {
        const response = await fetch(`${API_BASE_URL}/books/admin/moderation?status=${status}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminDeactivateBook: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/books/admin/${bookId}/deactivate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminReactivateBook: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/books/admin/${bookId}/reactivate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminDismissReport: async (token: string, bookId: string): Promise<Book> => {
        const response = await fetch(`${API_BASE_URL}/books/admin/${bookId}/dismiss-report`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminGetFeedback: async (token: string): Promise<Feedback[]> => {
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    adminUpdateFeedbackStatus: async (token: string, feedbackId: string, status: FeedbackStatus): Promise<Feedback> => {
        const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        return handleResponse(response);
    },

    adminGetKpis: async (token: string): Promise<KpiData> => {
        const response = await fetch(`${API_BASE_URL}/kpis`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },
};
