import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

import { dbConnect } from '@/lib/mongoose';
import Website from '@/models/Website';
import { getThemePreset } from '@/lib/theme-presets';

const LOCAL_STORE_PATH = path.join(process.cwd(), 'scratch', 'local-websites.json');

type WebsiteRecord = Record<string, any>;

function isMongoConnectionError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; syscall?: string; message?: string };
  const message = maybeError.message ?? '';

  return (
    maybeError.syscall === 'querySrv' ||
    maybeError.code === 'ECONNREFUSED' ||
    maybeError.code === 'ENOTFOUND' ||
    maybeError.code === 'ETIMEDOUT' ||
    message.includes('querySrv') ||
    message.includes('MongoServerSelectionError')
  );
}

async function ensureLocalStore() {
  await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });

  try {
    await fs.access(LOCAL_STORE_PATH);
  } catch {
    await fs.writeFile(LOCAL_STORE_PATH, '[]', 'utf8');
  }
}

async function readLocalWebsites() {
  await ensureLocalStore();
  const raw = await fs.readFile(LOCAL_STORE_PATH, 'utf8');

  try {
    return JSON.parse(raw) as WebsiteRecord[];
  } catch {
    return [];
  }
}

async function writeLocalWebsites(websites: WebsiteRecord[]) {
  await ensureLocalStore();
  await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(websites, null, 2), 'utf8');
}

function sortNewestFirst(websites: WebsiteRecord[]) {
  return [...websites].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function buildWebsiteRecord({
  userId,
  businessName,
  slug,
  isLocal = false,
}: {
  userId: string;
  businessName: string;
  slug: string;
  isLocal?: boolean;
}) {
  const timestamp = new Date().toISOString();
  const preset = getThemePreset('boutique');

  const record: any = {
    userId,
    slug,
    isActive: true,
    businessName,
    theme: preset.value,
    whatsappNumber: '',
    location: 'Kathmandu, Nepal',
    mapConfig: {
      query: 'Kathmandu, Nepal',
      zoom: 14,
    },
    logoUrl: '',
    faviconUrl: '',
    fontFamily: preset.config.fontFamily,
    primaryColor: preset.config.primaryColor,
    backgroundColor: preset.config.backgroundColor,
    heroBgColor: preset.config.heroBgColor,
    aboutBgColor: preset.config.aboutBgColor,
    productsBgColor: preset.config.productsBgColor,
    headingColor: preset.config.headingColor,
    textColor: preset.config.textColor,
    headingWeight: '800',
    heroHeadingColor: preset.config.heroHeadingColor,
    heroTextColor: preset.config.heroTextColor,
    heroHeadingWeight: '900',
    aboutHeadingColor: preset.config.aboutHeadingColor,
    aboutTextColor: preset.config.aboutTextColor,
    aboutHeadingWeight: '800',
    productsHeadingColor: preset.config.productsHeadingColor,
    productsTextColor: preset.config.productsTextColor,
    productsHeadingWeight: '800',
    navBgColor: preset.config.navBgColor,
    navTextColor: preset.config.navTextColor,
    footerBgColor: preset.config.footerBgColor,
    footerHeadingColor: preset.config.footerHeadingColor,
    footerTextColor: preset.config.footerTextColor,
    footerHeadingWeight: '700',
    navFontFamily: preset.config.navFontFamily,
    heroFontFamily: preset.config.heroFontFamily,
    aboutFontFamily: preset.config.aboutFontFamily,
    productsFontFamily: preset.config.productsFontFamily,
    footerFontFamily: preset.config.footerFontFamily,
    navHeadingWeight: '700',
    businessEmail: '',
    directPhone: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    twitterUrl: '',
    animationStyle: preset.config.animationStyle,
    navAnimationStyle: preset.config.navAnimationStyle,
    heroAnimationStyle: preset.config.heroAnimationStyle,
    messengerUsername: '',
    content: {
      hero: {
        title: `Welcome to ${businessName}`,
        subtitle: 'Experience quality and excellence like never before.',
        imageUrl:
          'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop',
        ctaText: 'Explore Our Collection',
      },
      about: {
        description: `${businessName} is dedicated to providing the best service in Nepal. Our passion for quality drives everything we do.`,
        imageUrl:
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&auto=format&fit=crop',
      },
      products: [],
    },
    isPublished: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isLocal) {
    record._id = randomUUID();
  }

  return record;
}

async function withFallback<T>(mongoOperation: () => Promise<T>, localOperation: () => Promise<T>) {
  try {
    await dbConnect();
    return await mongoOperation();
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    
    if (isProduction) {
      console.error('Database connection failed in production:', error);
      throw new Error('Database service is currently unavailable. Please check your connection string and IP whitelist.');
    }

    if (!isMongoConnectionError(error)) {
      throw error;
    }

    console.warn('MongoDB unavailable, falling back to local JSON store.');
    return await localOperation();
  }
}

export async function listWebsitesByUser(userId: string) {
  return withFallback(
    async () => clone(await Website.find({ userId }).sort({ createdAt: -1 }).lean()),
    async () => {
      const websites = await readLocalWebsites();
      return sortNewestFirst(websites.filter((website) => website.userId === userId));
    }
  );
}

export async function getWebsiteById(id: string) {
  return withFallback(
    async () => clone(await Website.findById(id).lean()),
    async () => {
      const websites = await readLocalWebsites();
      return clone(websites.find((website) => website._id === id) ?? null);
    }
  );
}

export async function getWebsiteBySlug(slug: string) {
  return withFallback(
    async () => clone(await Website.findOne({ slug }).lean()),
    async () => {
      const websites = await readLocalWebsites();
      return clone(websites.find((website) => website.slug === slug) ?? null);
    }
  );
}

export async function createWebsiteForUser(userId: string, data: { businessName: string; slug: string }) {
  return withFallback(
    async () => {
      const website = await Website.create(buildWebsiteRecord({ userId, ...data, isLocal: false }));
      return clone(website.toObject());
    },
    async () => {
      const websites = await readLocalWebsites();
      const existing = websites.find((website) => website.slug === data.slug);
      if (existing) {
        throw new Error('URL Slug already taken');
      }

      const website = buildWebsiteRecord({ userId, ...data, isLocal: true });
      websites.push(website);
      await writeLocalWebsites(websites);
      return website;
    }
  );
}

export async function updateWebsiteById(id: string, data: WebsiteRecord) {
  return withFallback(
    async () => clone(await Website.findByIdAndUpdate(id, data, { new: true }).lean()),
    async () => {
      const websites = await readLocalWebsites();
      const index = websites.findIndex((website) => website._id === id);
      if (index === -1) {
        return null;
      }

      const updatedWebsite = {
        ...websites[index],
        ...data,
        _id: websites[index]._id,
        updatedAt: new Date().toISOString(),
      };

      websites[index] = updatedWebsite;
      await writeLocalWebsites(websites);
      return clone(updatedWebsite);
    }
  );
}

export async function deleteWebsiteById(id: string) {
  return withFallback(
    async () => clone(await Website.findByIdAndDelete(id).lean()),
    async () => {
      const websites = await readLocalWebsites();
      const website = websites.find((item) => item._id === id) ?? null;
      if (!website) {
        return null;
      }

      await writeLocalWebsites(websites.filter((item) => item._id !== id));
      return clone(website);
    }
  );
}

export async function toggleWebsiteActiveById(id: string) {
  return withFallback(
    async () => {
      const website = await Website.findById(id);
      if (!website) {
        return null;
      }

      website.isActive = !website.isActive;
      await website.save();
      return { isActive: website.isActive };
    },
    async () => {
      const websites = await readLocalWebsites();
      const index = websites.findIndex((website) => website._id === id);
      if (index === -1) {
        return null;
      }

      websites[index] = {
        ...websites[index],
        isActive: !websites[index].isActive,
        updatedAt: new Date().toISOString(),
      };
      await writeLocalWebsites(websites);
      return { isActive: websites[index].isActive };
    }
  );
}

export async function listAllWebsites() {
  return withFallback(
    async () => clone(await Website.find({}).sort({ createdAt: -1 }).lean()),
    async () => {
      const websites = await readLocalWebsites();
      return sortNewestFirst(websites);
    }
  );
}

export async function getWebsitesByIds(ids: string[]) {
  return withFallback(
    async () => clone(await Website.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).lean()),
    async () => {
      const websites = await readLocalWebsites();
      return sortNewestFirst(websites.filter((website) => ids.includes(website._id)));
    }
  );
}
