import mongoose, { Schema, Document, models } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  siteId: string; // The slug or ID of the website
  productId: string; // The ID of the product within the website
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    siteId: { type: String, required: true },
    productId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

// Index for fast lookups
ReviewSchema.index({ siteId: 1, productId: 1 });

if (process.env.NODE_ENV === 'development' && models.Review) {
  delete (mongoose as any).models.Review;
}

const Review = models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
