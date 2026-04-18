import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISupportMessage {
  senderId: string;
  text: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  adminId: mongoose.Types.ObjectId;
  status: 'OPEN' | 'RESOLVED';
  messages: ISupportMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
    messages: [
      {
        senderId: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent model duplication in development
if (process.env.NODE_ENV === 'development' && models.SupportTicket) {
  delete (mongoose as any).models.SupportTicket;
}

const SupportTicket = models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
export default SupportTicket;
