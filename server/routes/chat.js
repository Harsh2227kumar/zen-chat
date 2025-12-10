const express = require("express");
const Room = require("../models/Room");
const Message = require("../models/Message");
const { protect } = require("../middleware/auth");

const router = express.Router();

//@route  POST /api/chat/rooms
//desc Create a new room
//@access Private

router.post("/rooms", protect, async (req, res) => {
  try {
    const { name, description, type, participants = [] } = req.body;

    const room = await Room.create({
      name,
      description,
      type: type || "group",
      participants: [...new Set([req.user._id, ...participants])],
      admin: req.user._id,
    });

    await room.populate("participants", "username email avatar status");
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
    const rooms = await Room.find({
      participants: req.user._id,
    })
      .populate("participants", "username email avatar status")
      .populate("lastMessage")
      .sort("-updatedAt");

    res.json({
      success: true,
      rooms,
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
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = parseInt(req.query.skip, 10) || 0;

    //verify user is in room
    const room = await Room.findOne({
      _id: roomId,
      participants: req.user._id,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const messages = await Message
      .find({ room: roomId })
      .populate("sender", "username avatar")
      .sort("-createdAt")
      .limit(limit)
      .skip(skip);

    res.json({
      success: true,
      messages: messages.reverse(),
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

module.exports = router;

