const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room is required"],
      trim: true,
      maxlength: [50, "Room name cannot exceed 50 characters"],
    },

    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    type: {
      type: String,
      enum: ["group", "private"],
      default: "group",
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    avatar: {
      type: String,
      default: "https://ui-avatars.com/api/?name=Room&background=6366f1",
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

roomSchema.index({type: 1, participants: 1});

module.exports = mongoose.model('Room', roomSchema);
