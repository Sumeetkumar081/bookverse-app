
import type React from 'react';

export interface User {
  id: string;
  name:string;
  phoneNumber: string; // Remains for user info
  communityUnit: string;
  email: string; 
  password?: string; // For client-side password handling in forms
  isApproved?: boolean; // For admin approval flow
  mygateId?: string; // For registration and admin validation
  emailOptOut?: boolean;
  isAdmin?: boolean; 
  isActive?: boolean; 
  deactivatedByAdmin?: boolean; 
  reactivationRequested?: boolean;
  reactivationRequestTimestamp?: number;
  wishlistBookIds?: string[];
}

export type BorrowRequestStatus = 
  'pending' | 
  'approved' | 
  'rejected' | 
  'cancelled' | 
  'pickup_confirmed' | // Book is currently with borrower
  'returned' | // Book has been returned by borrower / marked by owner
  'giveaway_completed'; // Giveaway book has been picked up and transaction is complete

export interface Book {
  id: string;
  title: string;
  author: string;
  ownerId: string;
  isAvailable: boolean; // True if not borrowed, not paused by owner, and no active requests affecting its immediate borrowability
  coverImageUrl?: string;
  borrowedByUserId?: string; 
  requestedByUserId?: string; // ID of user who currently has an active request (pending or approved)
  borrowRequestStatus?: BorrowRequestStatus;
  requestedTimestamp?: number; 
  decisionTimestamp?: number; 
  pickupTimestamp?: number; 
  returnedTimestamp?: number; // New: To track when a book was returned

  // New Fields
  description?: string; // Optional
  isbn?: string; // Optional
  genre: string; // Mandatory
  isGiveaway?: boolean; // Optional, defaults to false
  isPausedByOwner?: boolean; // To allow owner to temporarily delist

  // New fields for admin book deactivation and reporting
  isDeactivatedByAdmin?: boolean;
  isReportedForReview?: boolean;
  adminReviewRequestedTimestamp?: number; // Timestamp of the latest report
  reportReason?: string; // Reason provided by the user for reporting
  reportedByUsers?: Array<{ userId: string; timestamp: number; reason?: string }>; // Optional: to track who reported (reason here might be redundant if single reportReason is used)

  // Fields for new features
  language: string; // Mandatory, added for language filter
  dateAdded: number; // Timestamp, added for date filter
}

export type FeedbackStatus = 'new' | 'read' | 'for_later' | 'resolved';

export interface Feedback {
  id: string;
  userId: string; // User who submitted
  userName?: string; // To display in admin panel
  subject: string;
  message: string;
  timestamp: number;
  status: FeedbackStatus;
}

export interface Notification {
  id: string;
  userId: string; 
  type:
    | 'new_book_added'
    | 'borrow_request_received'
    | 'borrow_request_approved'
    | 'borrow_request_rejected'
    | 'borrow_request_cancelled' // Requester cancelled their request
    | 'approval_revoked_by_owner_to_requester' // New: Owner revoked their approval
    | 'pickup_confirmed_to_owner'
    | 'pickup_confirmed_to_borrower'
    | 'book_marked_returned' // Owner marked book as returned
    | 'request_auto_cancelled' // System cancelled (e.g. timeout, not yet implemented)
    | 'book_deleted_by_owner' 
    | 'book_paused_by_owner'
    | 'book_unpaused_by_owner'
    | 'giveaway_completed_to_owner'
    | 'giveaway_received_by_user'
    | 'user_deactivated_by_admin'
    | 'user_reactivated_by_admin'
    | 'user_self_deactivated'
    | 'user_self_reactivated' // New for user self-reactivation
    // New notification types for admin actions
    | 'user_requests_reactivation_to_admin'
    | 'reactivation_request_approved_to_user'
    | 'book_reported_to_admin'
    | 'book_deactivated_by_admin_to_owner'
    | 'book_reactivated_by_admin_to_owner'
    | 'book_return_reminder' // New: For owner to remind borrower
    | 'chat_message_received' // This type will no longer be used
    // Registration approval notifications
    | 'new_user_registered_for_admin'
    | 'registration_approved_to_user'
    | 'registration_rejected_to_user'
    | 'daily_digest_sent';
  message: string;
  bookId?: string;
  relatedUserId?: string; 
  chatSessionId?: string; 
  timestamp: number;
  isRead: boolean;
}

export type View = 
  'auth' | 
  'myLibrary' | 
  'communityBooks' | 
  'myActivityAndOutgoing' | 
  'myLendingActivity' | 
  'editProfile' | 
  'submitFeedback' | 
  'adminDashboard' | 
  'tutorialFAQ' |
  'messages' | 
  'wishlist';

export type AdminSubView = 'dashboardHome' | 'userManagement' | 'registrationApprovals' | 'feedbackManagement' | 'contentModeration';
export type MyLibrarySubView = 'add' | 'collection';


export interface OverdueInfo {
  daysBorrowed: number;
  isOverdue: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
  howItWorks?: boolean;
}

// Types for In-App Communication
export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  timestamp: number;
  formattedTimestamp?: string; // To display date and time
  senderName?: string;
}

export interface ChatSession {
  id: string;
  participantIds: User[]; // This field is populated with User objects by the backend
  lastMessageTimestamp: number;
  lastMessageText?: string;
  unreadCounts: {
    userId: string;
    count: number;
  }[];
}

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'confirm';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  flex1?: boolean;
}

export interface GoogleBookSearchResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    language?: string;
    industryIdentifiers?: Array<{
      type: 'ISBN_10' | 'ISBN_13';
      identifier: string;
    }>;
  };
}

export interface PaginatedBooksResponse {
    books: Book[];
    page: number;
    totalPages: number;
    totalBooks: number;
}

export interface KpiData {
  totalBooksOnPlatform: number;
  totalBorrowsAndGiveaways: number;
}