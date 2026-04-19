import mongoose, { Schema, Document, models } from 'mongoose';

export interface IWebsite extends Document {
  userId: string;
  slug: string;
  isActive: boolean;
  businessName: string;
  theme: string;
  whatsappNumber: string;
  location: string;
  mapConfig: {
    query: string;
    zoom: number;
  };
  logoUrl: string;
  faviconUrl: string;
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  heroBgColor: string;
  aboutBgColor: string;
  productsBgColor: string;
  headingColor: string;
  textColor: string;
  headingWeight: string;
  
  // Hero Granular
  heroHeadingColor: string;
  heroTextColor: string;
  heroHeadingWeight: string;

  // About Granular
  aboutHeadingColor: string;
  aboutTextColor: string;
  aboutHeadingWeight: string;

  // Products Granular
  productsHeadingColor: string;
  productsTextColor: string;
  productsHeadingWeight: string;

  // Navbar & Footer Granular
  navBgColor: string;
  navTextColor: string;
  footerBgColor: string;
  footerHeadingColor: string;
  footerTextColor: string;
  footerHeadingWeight: string;

  // Font Family Modular
  navFontFamily: string;
  heroFontFamily: string;
  aboutFontFamily: string;
  productsFontFamily: string;
  footerFontFamily: string;
  navHeadingWeight: string;

  // Business Identity
  businessEmail: string;
  directPhone: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  animationStyle: string;
  navAnimationStyle: string;
  heroAnimationStyle: string;
  messengerUsername: string;
  paymentQR: string;

  content: {
    hero: {
      title: string;
      subtitle: string;
      imageUrl: string;
      ctaText: string;
    };
    about: {
      description: string;
      imageUrl: string;
    };
      products: Array<{
        id: string;
        name: string;
        price: string;
        markedPrice?: string;
        costPrice?: string;
        discountPercent?: number;
        category?: string;
        subCategory?: string;
        quantity?: number;
        isNewArrival?: boolean;
        colors?: Array<{ name: string; hex: string }>;
        imageUrl: string;
        sizeEU: string;
        sizeINT: string;
        dimensions: {
          length: string;
          width: string;
          height: string;
        };
      }>;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSchema = new Schema<IWebsite>(
  {
    userId: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    businessName: { type: String, required: true },
    theme: { type: String, default: 'boutique' },
    whatsappNumber: { type: String, default: '' },
    location: { type: String, default: 'Kathmandu, Nepal' },
    mapConfig: {
      query: { type: String, default: 'Kathmandu, Nepal' },
      zoom: { type: Number, default: 14 }
    },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    fontFamily: { type: String, default: 'Inter' },
    primaryColor: { type: String, default: '#f59e0b' },
    backgroundColor: { type: String, default: '#ffffff' },
    heroBgColor: { type: String, default: '#111827' },
    aboutBgColor: { type: String, default: '#ffffff' },
    productsBgColor: { type: String, default: '#f9fafb' },
    headingColor: { type: String, default: '#111827' },
    textColor: { type: String, default: '#4b5563' },
    headingWeight: { type: String, default: '800' },

    // Section Granular Defaults
    heroHeadingColor: { type: String, default: '#ffffff' },
    heroTextColor: { type: String, default: '#e5e7eb' },
    heroHeadingWeight: { type: String, default: '900' },

    aboutHeadingColor: { type: String, default: '#111827' },
    aboutTextColor: { type: String, default: '#4b5563' },
    aboutHeadingWeight: { type: String, default: '800' },

    productsHeadingColor: { type: String, default: '#111827' },
    productsTextColor: { type: String, default: '#4b5563' },
    productsHeadingWeight: { type: String, default: '800' },

    // Navbar & Footer Defaults
    navBgColor: { type: String, default: '#ffffff' },
    navTextColor: { type: String, default: '#4b5563' },
    footerBgColor: { type: String, default: '#111827' },
    footerHeadingColor: { type: String, default: '#ffffff' },
    footerTextColor: { type: String, default: '#9ca3af' },
    footerHeadingWeight: { type: String, default: '700' },

    // Font Family Defaults (Empty means use global)
    navFontFamily: { type: String, default: '' },
    heroFontFamily: { type: String, default: '' },
    aboutFontFamily: { type: String, default: '' },
    productsFontFamily: { type: String, default: '' },
    footerFontFamily: { type: String, default: '' },
    navHeadingWeight: { type: String, default: '700' },

    // Business Identity Defaults
    businessEmail: { type: String, default: '' },
    directPhone: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    tiktokUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    animationStyle: { type: String, default: 'reveal' },
    navAnimationStyle: { type: String, default: 'reveal' },
    heroAnimationStyle: { type: String, default: 'reveal' },
    messengerUsername: { type: String, default: '' },
    paymentQR: { type: String, default: '' },

    content: {
      hero: {
        title: { type: String, default: 'Welcome to our store' },
        subtitle: { type: String, default: 'Find the best products here' },
        imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop' },
        ctaText: { type: String, default: 'Shop Now' },
      },
      about: {
        description: { type: String, default: 'We are a local business dedicated to providing quality products.' },
        imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&auto=format&fit=crop' },
      },
      products: [
        {
          id: { type: String },
          name: { type: String },
          price: { type: String },
          markedPrice: { type: String, default: '' },
          costPrice: { type: String, default: '' },
          discountPercent: { type: Number, default: 0 },
          category: { type: String, default: 'Uncategorized' },
          subCategory: { type: String, default: '' },
          quantity: { type: Number, default: 0 },
          isNewArrival: { type: Boolean, default: false },
          colors: [{
            _id: false,
            name: { type: String, default: '' },
            hex: { type: String, default: '#000000' }
          }],
          imageUrl: { type: String },
          sizeEU: { type: String, default: '' },
          sizeINT: { type: String, default: '' },
          dimensions: {
            length: { type: String, default: '' },
            width: { type: String, default: '' },
            height: { type: String, default: '' },
          },
        },
      ],
    },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// In development, the model might be cached with an old schema.
// This block ensures we use the latest schema during development HMR.
if (process.env.NODE_ENV === 'development' && models.Website) {
  delete (mongoose as any).models.Website;
}

const Website = models.Website || mongoose.model<IWebsite>('Website', WebsiteSchema);
export default Website;
