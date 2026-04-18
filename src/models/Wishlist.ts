import mongoose, { Schema, Document, models } from 'mongoose';

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  siteId: string;
  productId: string;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    siteId: { type: String, required: true },
    productId: { type: String, required: true },
  },
  { timestamps: true }
);

// Ensure a user can only have a product once in their wishlist for a specific site
WishlistSchema.index({ userId: 1, siteId: 1, productId: 1 }, { unique: true });

if (process.env.NODE_ENV === 'development' && models.Wishlist) {
  delete (mongoose as any).models.Wishlist;
}

const Wishlist = models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema);
export default Wishlist;
