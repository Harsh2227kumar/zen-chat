const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const User = require("../models/User");
const Room = require("../models/Room");
const Message = require("../models/Message");

async function viewDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");
    console.log("=" .repeat(80));
    console.log("DATABASE OVERVIEW");
    console.log("=" .repeat(80));
    console.log(`Database: ${mongoose.connection.db.databaseName}\n`);

    // Get counts
    const userCount = await User.countDocuments();
    const roomCount = await Room.countDocuments();
    const messageCount = await Message.countDocuments();

    console.log("📊 COLLECTION STATISTICS:");
    console.log(`   Users: ${userCount}`);
    console.log(`   Rooms: ${roomCount}`);
    console.log(`   Messages: ${messageCount}\n`);

    // Display Users
    console.log("=" .repeat(80));
    console.log("👥 USERS");
    console.log("=" .repeat(80));
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    if (users.length === 0) {
      console.log("No users found.\n");
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.username} (${user.email})`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Avatar: ${user.avatar || "N/A"}`);
        console.log(`   Last Seen: ${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : "N/A"}`);
        console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      });
    }

    // Display Rooms
    console.log("\n" + "=" .repeat(80));
    console.log("💬 ROOMS");
    console.log("=" .repeat(80));
    const rooms = await Room.find({})
      .populate("participants", "username email")
      .populate("admin", "username")
      .sort({ updatedAt: -1 });
    
    if (rooms.length === 0) {
      console.log("No rooms found.\n");
    } else {
      rooms.forEach((room, index) => {
        console.log(`\n${index + 1}. ${room.name} (${room.type})`);
        console.log(`   ID: ${room._id}`);
        console.log(`   Description: ${room.description || "N/A"}`);
        console.log(`   Admin: ${room.admin?.username || "N/A"}`);
        console.log(`   Participants (${room.participants.length}):`);
        room.participants.forEach((p) => {
          console.log(`      - ${p.username} (${p.email})`);
        });
        console.log(`   Avatar: ${room.avatar || "N/A"}`);
        console.log(`   Created: ${new Date(room.createdAt).toLocaleString()}`);
        console.log(`   Updated: ${new Date(room.updatedAt).toLocaleString()}`);
      });
    }

    // Display Messages
    console.log("\n" + "=" .repeat(80));
    console.log("📨 MESSAGES (Latest 20)");
    console.log("=" .repeat(80));
    const messages = await Message.find({})
      .populate("sender", "username")
      .populate("room", "name")
      .sort({ createdAt: -1 })
      .limit(20);
    
    if (messages.length === 0) {
      console.log("No messages found.\n");
    } else {
      messages.forEach((message, index) => {
        console.log(`\n${index + 1}. [${message.room?.name || "Unknown Room"}]`);
        console.log(`   From: ${message.sender?.username || "Unknown"}`);
        console.log(`   Content: ${message.content.substring(0, 100)}${message.content.length > 100 ? "..." : ""}`);
        console.log(`   Type: ${message.type}`);
        console.log(`   Read by: ${message.readBy.length} users`);
        console.log(`   Created: ${new Date(message.createdAt).toLocaleString()}`);
      });
    }

    console.log("\n" + "=" .repeat(80));
    console.log("✅ Database view complete!");
    console.log("=" .repeat(80));

    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error viewing database:", error);
    process.exit(1);
  }
}

viewDatabase();

