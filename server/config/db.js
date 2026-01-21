const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use the environment variable or a fallback
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://root:root@airbnb.fzehhma.mongodb.net/bus_tracking';
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('URI:', mongoUri ? 'Found' : 'Not found');
    
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;