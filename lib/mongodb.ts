import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = (global as any).mongooseCache;

if (!cached) {
  cached = (global as any).mongooseCache = { conn: null, promise: null };
}

export async function connectMongo(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<username>")) {
    // No valid MongoDB URI configured, gracefully fall back to local store
    return null;
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "knitflow",
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log(`[MongoDB] Connected successfully to database: ${mongooseInstance.connection.name}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.warn("MongoDB connection could not be established. Falling back to persistent local storage:", e);
    return null;
  }
}

