import mongoose, { Schema, Document, models } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username?: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: Date;
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
  deliveryAddress?: string;
  mapLocation?: {
    label?: string;
    lat?: number;
    lng?: number;
    placeId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'], default: 'ADMIN' },
    name: { type: String }, // For backward compatibility
    firstName: { type: String },
    middleName: { type: String },
    lastName: { type: String },
    dob: { type: Date },
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
    deliveryAddress: { type: String },
    mapLocation: {
      label: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      placeId: { type: String },
    },
  },
  { timestamps: true }
);

// Prevent model duplication in development
if (process.env.NODE_ENV === 'development' && models.User) {
  delete (mongoose as any).models.User;
}

const User = models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
