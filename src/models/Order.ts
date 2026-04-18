import mongoose, { Schema, Document, models } from 'mongoose';

export interface IOrder extends Document {
  siteId: string;
  customerId: mongoose.Types.ObjectId;
  product: {
    id: string;
    name: string;
    price: string;
    imageUrl?: string;
  };
  method: 'WHATSAPP' | 'MESSENGER';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    siteId: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: String, required: true },
      imageUrl: { type: String },
    },
    method: { type: String, enum: ['WHATSAPP', 'MESSENGER'], required: true },
  },
  { timestamps: true }
);

// Prevent model duplication in development
if (process.env.NODE_ENV === 'development' && models.Order) {
  delete (mongoose as any).models.Order;
}

const Order = models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
