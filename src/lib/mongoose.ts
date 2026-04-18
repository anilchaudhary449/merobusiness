import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";

// Import models here to avoid circular dependencies if possible, 
// or use mongoose.model('User') to get the model.
let User: any;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, mongod: null };
}

async function autoSeed() {
  try {
    // Load model dynamically to avoid issues
    if (!User) {
      User = mongoose.models.User || (await import("@/models/User")).default;
    }

    const adminEmail = "superadmin@merobusiness.com";
    const existing = await User.findOne({ email: adminEmail });
    
    if (!existing) {
      console.log("Auto-seeding superadmin...");
      const hashedPassword = await bcrypt.hash("admin123", 12);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        name: "Super Administrator",
        role: 'SUPER_ADMIN',
        permissions: {
          canChangeTheme: true,
        },
        assignedSiteIds: [],
      });
      console.log("Super Administrator created: admin123");
    }
  } catch (error) {
    console.error("Auto-seeding failed:", error);
  }
}

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = (async () => {
      let uri = process.env.MONGODB_URI || "mongodb://localhost:27017/merobusiness";
      
      const isLocal = uri.includes("localhost") || uri.includes("127.0.0.1") || uri.includes("::1");
      const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_URL;
      const isProduction = process.env.NODE_ENV === 'production';

      if (isLocal && !isVercel && !isProduction) {
        if (!cached.mongod) {
          console.log("Starting in-memory MongoDB for local testing...");
          cached.mongod = await MongoMemoryServer.create();
        }
        uri = cached.mongod.getUri();
        console.log("Connected to Memory DB at:", uri);
      }

      const conn = await mongoose.connect(uri, opts);
      
      // Auto-seed in dev if using memory DB or if explicitly needed
      if (!isProduction) {
        await autoSeed();
      }

      return conn;
    })();
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

