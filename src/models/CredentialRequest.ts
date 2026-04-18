import mongoose, { Schema, Document, models } from 'mongoose';

export interface ICredentialRequest extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  type: 'PASSWORD_RESET';
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialRequestSchema = new Schema<ICredentialRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    type: { type: String, enum: ['PASSWORD_RESET'], default: 'PASSWORD_RESET' },
    status: { type: String, enum: ['PENDING', 'RESOLVED', 'REJECTED'], default: 'PENDING' },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === 'development' && models.CredentialRequest) {
  delete (mongoose as any).models.CredentialRequest;
}

const CredentialRequest = models.CredentialRequest || mongoose.model<ICredentialRequest>('CredentialRequest', CredentialRequestSchema);
export default CredentialRequest;
