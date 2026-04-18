import mongoose, { Schema, Document, models } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username?: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  name?: string;
  phone?: string;
  panNumber?: string;
  nationalIdPhoto?: string; // base64
  businessName?: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  rejectionReason?: string;
  permissions: {
    canChangeTheme: boolean;
  };
  assignedSiteIds: string[];
  pendingProfileChanges?: {
    name?: string;
    phone?: string;
    panNumber?: string;
    businessName?: string;
    nationalIdPhoto?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN'], default: 'ADMIN' },
    name: { type: String },
    phone: { type: String },
    panNumber: { type: String },
    nationalIdPhoto: { type: String }, // base64 image
    businessName: { type: String },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'REJECTED'], default: 'ACTIVE' },
    rejectionReason: { type: String },
    permissions: {
      canChangeTheme: { type: Boolean, default: false },
    },
    assignedSiteIds: [{ type: String }],
    pendingProfileChanges: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Prevent model duplication in development
if (process.env.NODE_ENV === 'development' && models.User) {
  delete (mongoose as any).models.User;
}

const User = models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
