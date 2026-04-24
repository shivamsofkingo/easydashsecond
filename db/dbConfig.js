require("dotenv").config();
const mongoose = require("mongoose");
const { logger } = require("../config/loggerConfig.js");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 100,
      minPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Database connected :",process.env.MONGO_URI);
    const db = mongoose.connection;
    db.on("connected", () => console.log("MongoDB connection established"));
    db.on("error", (err) => logger.error(`MongoDB error: ${err.message}`, {err}));
    db.on("disconnected", () => console.log("MongoDB disconnected"));
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger("MongoDB connection closed due to app termination.");
      process.exit(0);
    });
  } catch (err) {
    console.error("Database connection failed", err);
    process.exit(1);
  }
}

// async function updateCountField() {
//   try {
//     await connectDB();
//     const Accommodation = mongoose.connection.collection('accomodations');
//     const result1 = await Accommodation.updateMany(
//       { roomType: { $type: "string" } },
//       [{ $set: { roomType: ["$roomType"] } }]
//     )
//     // const result2 = await User.updateMany({}, { $set: { followingCount: 0 } });

//     console.log(`${result1.matchedCount} documents matched the query.`);
//     console.log(`${result1.modifiedCount} documents were updated.`);
//   } catch (err) {
//     console.error("Error updating documents:", err);
//   } finally {
//     mongoose.connection.close();
//   }
// }

// updateCountField();

module.exports = connectDB;
