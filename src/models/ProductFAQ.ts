import mongoose, { Schema, Document, models } from 'mongoose';

export interface IProductFAQ extends Document {
  siteId: string;
  productId: string;
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductFAQSchema = new Schema<IProductFAQ>(
  {
    siteId: { type: String, required: true },
    productId: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

ProductFAQSchema.index({ siteId: 1, productId: 1 });

if (process.env.NODE_ENV === 'development' && models.ProductFAQ) {
  delete (mongoose as any).models.ProductFAQ;
}

const ProductFAQ = models.ProductFAQ || mongoose.model<IProductFAQ>('ProductFAQ', ProductFAQSchema);
export default ProductFAQ;
