const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const activeUsers = new Map();
const typingUsers = new Map();

module.exports = (io) => {
  // Helper functions defined in closure scope so they can access io
  async function joinUserRooms(socket, userId) {
    try {
      const rooms = await Room.find({ participants: userId });
      rooms.forEach(room => {
        socket.join(room._id.toString());
      });
    } catch (error) {
      console.error('Error joining user rooms:', error);
    }
  }

  async function updateUserStatus(userId, status) {
    try {
      await User.findByIdAndUpdate(userId, {
        status,
        lastSeen: Date.now()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  function clearTyping(roomId, userId) {
    const key = `${roomId}-${userId}`;
    if (typingUsers.has(key)) {
      typingUsers.delete(key);
      io.to(roomId).emit('typing:stop', { roomId, userId });
    }
  }

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
        console.log(`User connected: ${socket.user.username} (${userId})`);
        

    activeUsers.set(userId, {
            socketId: socket.id,
            user: socket.user
        });


        // updates user status to online
        updateUserStatus(userId, 'online');

        //join user's room
        joinUserRooms(socket, userId);

        // Broadcast user online status

        io.emit('user:status', {
            userId,
            status: 'online'
        });

        socket.on('room:join', async (roomId) => {
            try {
                const room = await Room.findOne({
                    _id: roomId,
                    participants: userId
                });
                
                if (room){
                    socket.join(roomId.toString());
                    console.log(`User ${socket.user.username} joined room ${roomId}`);
                } else {
                    console.log(`User ${socket.user.username} attempted to join room ${roomId} but is not a participant`);
                }
            }
            catch (error) {
                console.error(`Error joining room ${roomId}:`, error);
            }
        });

        // Handle room creation - automatically join if user is a participant
        socket.on('room:created', async (data) => {
            try {
                const roomId = data.roomId || data.room?._id;
                if (!roomId) return;

                const room = await Room.findById(roomId);
                if (!room) return;

                // Check if this user is a participant
                const isParticipant = room.participants.some(
                    (p) => p.toString() === userId
                );

                if (isParticipant) {
                    socket.join(roomId.toString());
                    console.log(`User ${socket.user.username} auto-joined new room ${roomId}`);
                }
            } catch (error) {
                console.error(`Error handling room:created event:`, error);
            }
        });

    socket.on(`message:send`, async (data) => {
        try {
            const { roomId, content } = data;

            // Validation
            if (!content || content.trim().length === 0) {
                return socket.emit('message:error', { message: 'Message content cannot be empty' });
            }

            if (content.length > 2000) {
                return socket.emit('message:error', { message: 'Message cannot exceed 2000 characters' });
            }

            const room = await Room.findOne({
                _id: roomId,
                participants: userId
            });

            if (!room) {
                return socket.emit('message:error', { message: 'You are not a participant of this room.' });
            }

            const message = await Message.create({
                content: content.trim(), 
                sender: userId,
                room: roomId,
                type: 'text'
            });

            await message.populate('sender', 'username avatar');
            await message.populate('readBy.user', 'username avatar');

            room.lastMessage = message._id;
            await room.save();

            io.to(roomId.toString()).emit('message:new', {message});

            clearTyping(roomId, userId);
        }
        catch (error){
            console.error('Error sending message:', error);
            socket.emit('message:error', {message: 'Failed to send message.'});
        }
    });

    // Handle typing indicator
    socket.on('typing:start', async ({ roomId }) => {
      const key = `${roomId}-${userId}`;
      
      if (!typingUsers.has(key)) {
        typingUsers.set(key, {
          roomId,
          userId,
          username: socket.user.username
        });

        socket.to(roomId).emit('typing:start', {
          roomId,
          userId,
          username: socket.user.username
        });

        // Auto-clear after 3 seconds
        setTimeout(() => {
          clearTyping(roomId, userId);
        }, 3000);
      }
    });

    socket.on('typing:stop', ({ roomId }) => {
      clearTyping(roomId, userId);
    });

    // Handle message read
    socket.on('message:read', async ({ messageId, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        
        if (message && !message.readBy.some(r => r.user.toString() === userId)) {
          message.readBy.push({ user: userId });
          await message.save();

          io.to(roomId).emit('message:read', {
            messageId,
            userId,
            roomId
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
      
      activeUsers.delete(userId);
      updateUserStatus(userId, 'offline');

      // Clear all typing indicators for this user
      for (const [key, value] of typingUsers.entries()) {
        if (value.userId === userId) {
          socket.to(value.roomId).emit('typing:stop', {
            roomId: value.roomId,
            userId
          });
          typingUsers.delete(key);
        }
      }

      io.emit('user:status', {
        userId,
        status: 'offline'
      });
    });
  });
};