import mongoose, { Schema, Document } from 'mongoose';

// Define FeedbackStatus locally to remove dependency on frontend code
export type FeedbackStatus = 'new' | 'read' | 'for_later' | 'resolved';

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
      transform: (doc: any, ret: any) => {
          ret.id = ret._id.toString();
          delete ret._id;
          delete ret.__v;
      }
  },
  toObject: {
      virtuals: true,
      transform: (doc: any, ret: any) => {
          ret.id = ret._id.toString();
          delete ret._id;
          delete ret.__v;
      }
  }
});

const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
export default Feedback;