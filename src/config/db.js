const mongoose = require("mongoose");
const { MONGO_URI } = require("./env");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const db = await mongoose.connect(MONGO_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw err; // Vercel will handle the error appropriately
  }
};

module.exports = connectDB;
