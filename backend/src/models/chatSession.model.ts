
import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
  participantIds: mongoose.Types.ObjectId[];
  lastMessageTimestamp: number;
  lastMessageText?: string;
  unreadCounts: {
      userId: mongoose.Types.ObjectId;
      count: number;
  }[];
}

const ChatSessionSchema: Schema = new Schema({
  participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessageTimestamp: { type: Number, default: Date.now },
  lastMessageText: { type: String },
  unreadCounts: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      count: { type: Number, default: 0 }
  }]
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

// Create a compound index on participantIds to ensure uniqueness
// The sorting of participantIds before creating/finding a session is handled in the controller.
ChatSessionSchema.index({ participantIds: 1 });


const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
export default ChatSession;