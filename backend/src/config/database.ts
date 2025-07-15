
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('!!! WARNING: MONGODB_URI is not defined in environment variables.');
    console.warn('!!! The application will run without a database connection.');
    console.warn('!!! API endpoints will return empty data or a service unavailable error.');
    return; // Do not attempt to connect; allow the server to start.
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected successfully.');
  } catch (error) {
    const err = `MongoDB connection failed: ${(error as Error).message}`;
    console.error(err);
    // If a URI was provided but failed, we throw the error to prevent the server from starting in a broken state.
    throw new Error(err);
  }
};

export default connectDB;
