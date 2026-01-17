import mongoose from "mongoose";

// Retry connection with exponential backoff
const connectWithRetry = async (uri, options, retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(uri, options);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.log(`MongoDB connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

export const connectDB = async () => {
  try {
    // Set mongoose options for better connection handling
    const options = {
      serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6 (helps with DNS issues)
      retryWrites: true,
      w: 'majority',
    };
    
    let uri = process.env.MONGODB_URI;
    
    // If SRV fails, try converting to standard connection string
    // User should update MONGODB_URI in Render dashboard to use non-SRV format
    // Example: mongodb://nafij:nafij@cluster0-shard-00-00.8pr5g.mongodb.net:27017,...
    
    await connectWithRetry(uri, options);
  } catch (error) {
    console.log("MongoDB connection error:", error);
    console.log("\n⚠️  IMPORTANT: If you see DNS errors on Render, try these steps:");
    console.log("1. Go to MongoDB Atlas → Database → Connect");
    console.log("2. Choose 'Drivers' and select version 2.2.12 or later");
    console.log("3. Copy the NON-SRV connection string (mongodb://... not mongodb+srv://)");
    console.log("4. Update MONGODB_URI in your Render environment variables");
    console.log("5. Redeploy your service\n");
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected! Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error:', err);
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected!');
});
