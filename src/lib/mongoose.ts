import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, mongod: null };
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
      
      // Automatic fallback to an in-memory database for local testing
      const isLocal = uri.includes("localhost") || uri.includes("127.0.0.1") || uri.includes("::1");
      const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_URL;
      const isProduction = process.env.NODE_ENV === 'production';

      if (isLocal && !isVercel && !isProduction) {
        console.log("Starting in-memory MongoDB for local testing...");
        if (!cached.mongod) {
          cached.mongod = await MongoMemoryServer.create();
        }
        uri = cached.mongod.getUri();
        console.log("Connected to Memory DB at:", uri);
      }

      return mongoose.connect(uri, opts);
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
