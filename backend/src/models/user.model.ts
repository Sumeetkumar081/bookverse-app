import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Backend User interface, defined independently of the frontend.
export interface IUser {
  name: string;
  phoneNumber: string;
  communityUnit: string;
  email: string;
  password?: string;
  mygateId: string;
  isApproved: boolean;
  isAdmin: boolean;
  isActive: boolean;
  emailOptOut: boolean;
  deactivatedByAdmin: boolean;
  reactivationRequested: boolean;
  reactivationRequestTimestamp?: number;
  wishlistBookIds?: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  matchPassword?(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true }, // Uniqueness constraint removed to align with email-first
    communityUnit: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false }, // select: false prevents password from being returned by default
    
    mygateId: { type: String, required: true }, // Added field
    isApproved: { type: Boolean, default: false }, // Added field, defaults to false

    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    emailOptOut: { type: Boolean, default: false },
    deactivatedByAdmin: { type: Boolean, default: false },
    reactivationRequested: { type: Boolean, default: false },
    reactivationRequestTimestamp: { type: Number },
    wishlistBookIds: [{ type: String }],

    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Number },
}, {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password; // Ensure password is never in the JSON output
      }
    },
    toObject: {
        virtuals: true,
        transform: function(doc, ret: any) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            delete ret.password;
        }
    }
});

// Pre-save middleware to hash password before saving
UserSchema.pre<IUser & Document>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;