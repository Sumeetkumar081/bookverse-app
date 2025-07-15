import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackStatus } from '../../../frontend/src/types'; // This is a slight anti-pattern, but for simplicity here we reference it. In a monorepo, this would be a shared type.

export interface IFeedback extends Document {
  userId: string;
  subject: string;
  message: string;
  timestamp: number;
  status: FeedbackStatus;
}

const FeedbackSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  timestamp: { type: Number, required: true, default: Date.now },
  status: {
    type: String,
    enum: ['new', 'read', 'for_later', 'resolved'],
    default: 'new',
  },
}, {
  timestamps: true,
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

const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
export default Feedback;