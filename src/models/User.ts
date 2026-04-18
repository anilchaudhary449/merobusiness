import mongoose, { Schema, Document, models } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  name?: string;
  permissions: {
    canChangeTheme: boolean;
  };
  assignedSiteIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN'], default: 'ADMIN' },
    name: { type: String },
    permissions: {
      canChangeTheme: { type: Boolean, default: false },
    },
    assignedSiteIds: [{ type: String }],
  },
  { timestamps: true }
);

// Prevent model duplication in development
if (process.env.NODE_ENV === 'development' && models.User) {
  delete (mongoose as any).models.User;
}

const User = models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
