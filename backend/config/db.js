import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

let connectionPromise = null;
let hasLoggedConnection = false;
let listenersAttached = false;

function readMongoUri() {
  const mongoUri = String(process.env.MONGO_URI || "").trim();

  if (!mongoUri) {
    const error = new Error("MONGO_URI is required. Add your MongoDB Atlas connection string to backend/.env or your hosting environment.");
    error.name = "MongoConfigurationError";
    throw error;
  }

  return mongoUri;
}

function connectionOptions() {
  return {
    autoIndex: process.env.MONGO_AUTO_INDEX !== "false",
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000),
  };
}

function showDevelopmentHelp(error) {
  console.error("MongoDB connection failed.");
  console.error(`Reason: ${error.message}`);
  console.error("Check that:");
  console.error("- backend/.env has a valid MONGO_URI copied from MongoDB Atlas");
  console.error("- the URI uses a Database Access user, not your Atlas login account");
  console.error("- the database username and password are correct");
  console.error("- special characters in the password are URL encoded");
  console.error("- authSource=admin is present when the URI includes a database name");
  console.error("- MongoDB Atlas Network Access allows your current IP address or 0.0.0.0/0 for hosting");
  console.error("- the database name is present in the URI path, for example /st_gabriel_church");
}

function handleConnectionError(error) {
  connectionPromise = null;

  if (process.env.NODE_ENV === "production") {
    console.error("Production MongoDB connection failed. Exiting process.");
    console.error(error);
    process.exit(1);
  }

  showDevelopmentHelp(error);
  throw error;
}

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    if (hasLoggedConnection && process.env.NODE_ENV !== "test") {
      console.warn("MongoDB disconnected.");
    }
  });
}

export async function connectDB() {
  attachConnectionListeners();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    if (!connectionPromise) {
      connectionPromise = mongoose.connect(readMongoUri(), connectionOptions());
    }

    await connectionPromise;

    if (!hasLoggedConnection) {
      hasLoggedConnection = true;
      console.log(`MongoDB connected successfully: ${mongoose.connection.host}/${mongoose.connection.name}`);
    }

    return mongoose.connection;
  } catch (error) {
    return handleConnectionError(error);
  }
}

export async function disconnectDB() {
  connectionPromise = null;
  hasLoggedConnection = false;
  await mongoose.disconnect();
}

export default connectDB;
