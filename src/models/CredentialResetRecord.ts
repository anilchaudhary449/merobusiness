import mongoose, { Schema, Document, models } from 'mongoose';

export interface ICredentialResetRecord extends Document {
  userId: mongoose.Types.ObjectId;
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  adminId?: mongoose.Types.ObjectId; // The Admin under which this customer is, or null if it's an admin reset
  resetBy: 'SYSTEM' | 'SUPER_ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const CredentialResetRecordSchema = new Schema<ICredentialResetRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userRole: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'], required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    resetBy: { type: String, enum: ['SYSTEM', 'SUPER_ADMIN'], default: 'SYSTEM' },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === 'development' && models.CredentialResetRecord) {
  delete (mongoose as any).models.CredentialResetRecord;
}

const CredentialResetRecord = models.CredentialResetRecord || mongoose.model<ICredentialResetRecord>('CredentialResetRecord', CredentialResetRecordSchema);
export default CredentialResetRecord;
