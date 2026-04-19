import mongoose, { Schema, Document, models } from 'mongoose';

export interface IOrder extends Document {
  siteId: string;
  customerId: mongoose.Types.ObjectId;
  product: {
    id: string;
    name: string;
    price: string;
    markedPrice?: string;
    costPrice?: string;
    category?: string;
    subCategory?: string;
    imageUrl?: string;
    quantity?: number;
  };
  method: 'WHATSAPP' | 'MESSENGER';
  status: 'PLACED' | 'CONFIRMED' | 'PACKED' | 'PICKED' | 'SHIPPED' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'COD' | 'ONLINE_PAYMENT';
  paymentReceipt?: string;
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
      markedPrice: { type: String, default: '' },
      costPrice: { type: String, default: '' },
      category: { type: String, default: 'Uncategorized' },
      subCategory: { type: String, default: '' },
      imageUrl: { type: String },
      quantity: { type: Number, default: 1 },
    },
    method: { type: String, enum: ['WHATSAPP', 'MESSENGER'], required: true },
    status: { 
      type: String, 
      enum: ['PLACED', 'CONFIRMED', 'PACKED', 'PICKED', 'SHIPPED', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'], 
      default: 'PLACED' 
    },
    paymentMethod: { 
      type: String,
      enum: ['COD', 'ONLINE_PAYMENT'], 
      default: 'COD' 
    },
    paymentReceipt: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent model duplication in development
if (process.env.NODE_ENV === 'development' && models.Order) {
  delete (mongoose as any).models.Order;
}

const Order = models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
