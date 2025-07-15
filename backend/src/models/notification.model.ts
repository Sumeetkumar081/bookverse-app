
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: string;
  message: string;
  bookId?: string;
  relatedUserId?: string;
  chatSessionId?: string;
  timestamp: number;
  isRead: boolean;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  bookId: { type: String },
  relatedUserId: { type: String },
  chatSessionId: { type: String },
  timestamp: { type: Number, required: true, default: Date.now },
  isRead: { type: Boolean, default: false },
}, {
  timestamps: true, // This adds createdAt and updatedAt fields
  toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
          ret.id = ret._id.toString();
          delete ret._id;
          delete ret.__v;
      }
  },
  toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
          ret.id = ret._id.toString();
          delete ret._id;
          delete ret.__v;
      }
  }
});

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;