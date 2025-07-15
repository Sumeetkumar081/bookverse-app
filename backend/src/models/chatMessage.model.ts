
import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  messageText: string;
  timestamp: number;
}

const ChatMessageSchema: Schema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messageText: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
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

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessage;