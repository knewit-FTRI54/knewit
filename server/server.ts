import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';
import 'dotenv/config';

console.log('Booting server...');
console.log('Start of server.ts');

const port = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/knewit';

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Start the Express server
    app
      .listen(port, () => {
        console.log(`✅ App listening on port ${port}`);
      })
      .on('error', (err) => {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
      });
  } catch (error) {
    console.error(
      '❌ Failed during initialization:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error('❌ Unhandled error during startup:', error);
  process.exit(1);
});