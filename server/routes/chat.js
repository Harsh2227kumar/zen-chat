const express = require("express");
const Room = require("../models/Room");
const Message = require("../models/Message");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Store io instance to emit events
let ioInstance = null;

// Function to set io instance
router.setIO = (io) => {
  ioInstance = io;
};

//@route  POST /api/chat/rooms
//desc Create a new room
//@access Private

router.post("/rooms", protect, async (req, res) => {
  try {
    const { name, description, type, participants = [] } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Room name is required"
      });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Room name cannot exceed 50 characters"
      });
    }

    if (description && description.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 200 characters"
      });
    }

    const room = await Room.create({
      name: name.trim(),
      description: description?.trim(),
      type: type || "group",
      participants: [...new Set([req.user._id, ...participants])],
      admin: req.user._id,
    });

    await room.populate("participants", "username email avatar status");
    
    // Emit room creation event to all participants so they can join the socket room
    if (ioInstance) {
      const participantIds = room.participants.map(p => p._id.toString());
      const roomData = {
        roomId: room._id.toString(),
        participantIds: participantIds,
        room: room.toObject()
      };
      
      // Emit to all connected sockets - they will check if they're participants
      ioInstance.emit('room:created', roomData);
      
      // Also force join all participant sockets immediately
      room.participants.forEach((participant) => {
        const participantId = participant._id.toString();
        // Find all sockets for this participant and join them to the room
        const sockets = ioInstance.sockets.sockets;
        for (const [socketId, socket] of sockets) {
          if (socket.user && socket.user._id.toString() === participantId) {
            socket.join(room._id.toString());
            console.log(`Forced socket join: User ${socket.user.username} joined room ${room._id}`);
          }
        }
      });
    }
    
    res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/rooms", protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100); // Max 100 rooms per request
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const rooms = await Room.find({
      participants: req.user._id,
    })
      .populate("participants", "username email avatar status")
      .populate("lastMessage", "content createdAt")
      .sort("-updatedAt")
      .limit(limit)
      .skip(skip);

    const totalRooms = await Room.countDocuments({
      participants: req.user._id,
    });

    res.json({
      success: true,
      rooms,
      pagination: {
        limit,
        skip,
        total: totalRooms,
        hasMore: skip + limit < totalRooms,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/rooms/:roomId/messages", protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100); // Max 100 messages
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    // Verify user is in room
    const room = await Room.findOne({
      _id: roomId,
      participants: req.user._id,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found or you are not a participant",
      });
    }

    const messages = await Message
      .find({ room: roomId })
      .populate("sender", "username avatar")
      .populate("readBy.user", "username avatar")
      .sort("-createdAt")
      .limit(limit)
      .skip(skip);

    const totalMessages = await Message.countDocuments({ room: roomId });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        limit,
        skip,
        total: totalMessages,
        hasMore: skip + limit < totalMessages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

//@route POST /api/chat/rooms/private
//@desc Create or get private chat
//@access private

router.post("/rooms/private", protect, async (req, res) => {
    try {
        const {userId} = req.body;
        let room = await Room.findOne({
            type: 'private',
            participants: { $all: [req.user._id, userId], $size: 2}
        })
    .populate('participants', 'username email avatar status');

        if(!room){
            room = await Room.create({
                name: 'Private Chat',
                type: 'private',
        participants: [req.user._id, userId]
            });

            await room.populate('participants', 'username email avatar status');
        }
        res.json({
            success: true,
            room
        });
    }

    catch (error){
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


//@route POST /api/chat/rooms/private-by-username
//@desc Create or get private chat by target username
//@access private

router.post("/rooms/private-by-username", protect, async (req, res) => {
    try {
        const { targetUsername } = req.body;

        // 1. Find the target user by username
        const targetUser = await User.findOne({ username: targetUsername });

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // 2. Prevent initiating chat with self
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Cannot start a private chat with yourself.",
            });
        }

        const userId = targetUser._id;
        
        // 3. Existing logic to create or retrieve the private room
        let room = await Room.findOne({
            type: 'private',
            participants: { $all: [req.user._id, userId], $size: 2}
        })
        .populate('participants', 'username email avatar status');

        const isNewRoom = !room; // Track if this is a new room

        if(!room){
            room = await Room.create({
                name: 'Private Chat',
                type: 'private',
                participants: [req.user._id, userId]
            });

            await room.populate('participants', 'username email avatar status');
        }

        // Ensure sockets are joined for all participants
        if (ioInstance) {
          room.participants.forEach((participant) => {
            const participantId = participant._id.toString();
            const sockets = ioInstance.sockets.sockets;
            for (const [socketId, socket] of sockets) {
              if (socket.user && socket.user._id.toString() === participantId) {
                socket.join(room._id.toString());
              }
            }
          });

          // Only emit room:created event for NEW rooms (not existing ones)
          if (isNewRoom) {
            const participantIds = room.participants.map(p => p._id.toString());
            const roomData = {
              roomId: room._id.toString(),
              participantIds: participantIds,
              room: room.toObject()
            };
            
            // Emit to all connected sockets - they will check if they're participants
            ioInstance.emit('room:created', roomData);
            console.log(`Room created: ${room._id} - Emitted room:created event`);
          }
        }
        
        res.json({
            success: true,
            room
        });
    }
    catch (error){
        console.error("Error creating private chat by username:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;