

import mongoose, { Schema, Document } from 'mongoose';

// This interface is a representation of the Book document in MongoDB.
// We are not importing from the frontend `types.ts` to keep backend and frontend concerns separate.
export interface IBook extends Document {
  title: string;
  author: string;
  ownerId: string;
  isAvailable: boolean;
  coverImageUrl?: string;
  borrowedByUserId?: string;
  requestedByUserId?: string;
  borrowRequestStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'pickup_confirmed' | 'returned' | 'giveaway_completed';
  requestedTimestamp?: number;
  decisionTimestamp?: number;
  pickupTimestamp?: number;
  returnedTimestamp?: number;
  description?: string;
  isbn?: string;
  genre: string;
  isGiveaway?: boolean;
  isPausedByOwner?: boolean;
  isDeactivatedByAdmin?: boolean;
  isReportedForReview?: boolean;
  adminReviewRequestedTimestamp?: number;
  reportReason?: string;
  reportedByUsers?: { userId: string; timestamp: number; reason?: string }[];
  language: string;
  dateAdded: number;
}

const BookSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true, index: true },
    isAvailable: { type: Boolean, default: true },
    coverImageUrl: { type: String },
    borrowedByUserId: { type: String, index: true },
    requestedByUserId: { type: String, index: true },
    borrowRequestStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'pickup_confirmed', 'returned', 'giveaway_completed', null],
    },
    requestedTimestamp: { type: Number },
    decisionTimestamp: { type: Number },
    pickupTimestamp: { type: Number },
    returnedTimestamp: { type: Number },
    description: { type: String },
    isbn: { type: String },
    genre: { type: String, required: true },
    isGiveaway: { type: Boolean, default: false },
    isPausedByOwner: { type: Boolean, default: false },
    isDeactivatedByAdmin: { type: Boolean, default: false },
    isReportedForReview: { type: Boolean, default: false },
    adminReviewRequestedTimestamp: { type: Number },
    reportReason: { type: String },
    reportedByUsers: [{
        userId: String,
        timestamp: Number,
        reason: String
    }],
    language: { type: String, required: true },
    dateAdded: { type: Number, required: true, default: Date.now }
}, {
    timestamps: true, // This adds createdAt and updatedAt fields automatically
    toJSON: {
      virtuals: true, // Ensure virtual fields are included in JSON output
      transform: function(doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      }
    },
    toObject: {
        virtuals: true,
        transform: function(doc, ret: any) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
        }
    }
});


const Book = mongoose.model<IBook>('Book', BookSchema);
export default Book;