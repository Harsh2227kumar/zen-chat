import { useEffect, useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { NewGroupModal } from "@/components/chat/NewGroupModal";
import { io, Socket } from "socket.io-client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  isOnline: boolean;
  unreadCount?: number;
  isGroup?: boolean;
  participants?: Array<{ _id: string; username: string; avatar?: string }>;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  readBy?: Array<{ user: string; readAt: string }>;
  createdAt?: string;
}

export default function Index() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize socket connection and fetch initial data
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      setConnectError("Missing auth token. Please log in again.");
      return;
    }

    const apiBase =
      import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    const newSocket = io(apiBase, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      withCredentials: true,
      auth: {
        token,
      },
    });

    newSocket.on("connect", async () => {
      console.log("Connected to server");
      setConnectError(null);

      try {
        // Get current user info
        const userResponse = await fetch("/api/auth/me", { credentials: "include" });
        let currentUserId: string | null = null;
        let currentUsername: string | null = null;

        if (userResponse.ok) {
          const { user } = await userResponse.json();
          currentUserId = user._id;
          currentUsername = user.username;
          setCurrentUser({ id: user._id, username: user.username });
        }

        // Get rooms list
        const roomsResponse = await fetch("/api/chat/rooms", { credentials: "include" });

        if (roomsResponse.ok) {
          const { rooms = [] } = await roomsResponse.json();

          // Emit room:join for each room to ensure user is in all socket rooms
          rooms.forEach((room: any) => {
            newSocket.emit('room:join', room._id);
          });

          const formattedRooms = rooms.map((room: any) => {
            const isGroup = room.type === "group";
            const participants = room.participants || [];

            // Convert IDs to strings for comparison
            const currentUserIdStr = currentUserId?.toString();
            const otherParticipants = participants.filter((p: any) => {
              const pId = p._id?.toString ? p._id.toString() : p._id;
              return pId !== currentUserIdStr;
            });

            // For private chats, always use the other participant's name
            // For group chats, use the room name
            let roomName: string;
            if (isGroup) {
              roomName = room.name || "Unnamed Group";
            } else {
              // For private chats, show only the OTHER participant's name (not all participants)
              if (otherParticipants.length === 1) {
                roomName = otherParticipants[0].username || otherParticipants[0].email || "Unknown";
              } else if (otherParticipants.length > 1) {
                roomName = otherParticipants.map((p: any) => p.username || p.email || "Unknown").join(", ");
              } else {
                roomName = "Private Chat";
              }
            }

            // Get avatar from other participant for private chats, or room avatar for groups
            let roomAvatar = "";
            if (isGroup) {
              // For groups, use room avatar
              roomAvatar = room.avatar || "";
            } else {
              // For private chats, always use the other participant's avatar
              if (otherParticipants.length > 0) {
                roomAvatar = otherParticipants[0].avatar || "";
              }
            }

            const lastMessageText = room.lastMessage?.content || "";

            return {
              id: room._id,
              name: roomName,
              avatar: roomAvatar,
              lastMessage: lastMessageText,
              isOnline: otherParticipants.some((p: any) => p.status === "online") || false,
              unreadCount: room.unreadCount || 0,
              isGroup,
              participants: room.participants || [],
            };
          });
          setContacts(formattedRooms);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }

      setLoading(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setConnectError(err.message || "Unable to connect to chat server");
      setLoading(false);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnectError("Disconnected from server. Reconnecting...");
    });

    newSocket.on("message:new", (data: any) => {
      const messageData = data.message || data;
      const formattedMessage = {
        id: messageData._id,
        content: messageData.content,
        timestamp: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        senderId: messageData.sender._id,
        senderName: messageData.sender.username,
        readBy: messageData.readBy || [],
        createdAt: messageData.createdAt,
      };

      setMessages((prev) => {
        const roomMessages = prev[messageData.room] || [];

        // 1. Try to find and replace the optimistic message by matching content and sender
        // Note: The optimistic message has a tempId that starts with 'temp-'
        const optimisticIndex = roomMessages.findIndex(
          (msg) =>
            msg.id.startsWith("temp-") &&
            msg.content === formattedMessage.content &&
            msg.senderId === formattedMessage.senderId
        );

        if (optimisticIndex !== -1) {
          // Found optimistic message, replace it with the final server message
          const newRoomMessages = [...roomMessages];
          newRoomMessages[optimisticIndex] = formattedMessage;

          return {
            ...prev,
            [messageData.room]: newRoomMessages,
          };
        }

        // 2. Fallback: Check if the final message ID already exists (to prevent duplicates if replacement failed or if it's an old message)
        const finalIdExists = roomMessages.some((msg) => msg.id === formattedMessage.id);
        if (finalIdExists) return prev;

        // 3. Otherwise, append the message (this handles messages sent by others or messages that missed the replacement check)
        return {
          ...prev,
          [messageData.room]: [...roomMessages, formattedMessage],
        };
      });

      // Update last message in contacts
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === messageData.room
            ? { ...contact, lastMessage: messageData.content }
            : contact
        )
      );
    });

    newSocket.on("user:status", (data: any) => {
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === data.userId
            ? { ...contact, isOnline: data.status === "online" }
            : contact
        )
      );
    });

    newSocket.on("message:error", (data: any) => {
      console.error("Message error:", data.message);
      setConnectError(data.message || "Failed to send message");
      // Clear error after 3 seconds
      setTimeout(() => setConnectError(null), 3000);
    });

    // Listen for new room creation - join the room and update contacts
    newSocket.on("room:created", async (roomData: { roomId: string; participantIds?: string[]; room?: any }) => {
      const roomId = roomData.roomId || roomData.room?._id;
      if (!roomId) return;

      // Get current user ID - try from state first, then fetch if needed
      let currentUserIdStr = currentUser?.id?.toString();

      // If currentUser not set yet, fetch it
      if (!currentUserIdStr) {
        try {
          const userResponse = await fetch("/api/auth/me", { credentials: "include" });
          if (userResponse.ok) {
            const { user } = await userResponse.json();
            currentUserIdStr = user._id?.toString();
            if (!currentUser) {
              setCurrentUser({ id: user._id, username: user.username });
            }
          }
        } catch (error) {
          console.error("Error fetching user in room:created handler:", error);
        }
      }

      if (!currentUserIdStr) return;

      const isParticipant = roomData.participantIds?.includes(currentUserIdStr) ||
        roomData.room?.participants?.some((p: any) => {
          const pId = p._id?.toString ? p._id.toString() : p._id;
          return pId === currentUserIdStr;
        });

      if (!isParticipant) return;

      try {
        // Check if room already exists in contacts to prevent duplicates
        const roomExists = contacts.some(c => c.id === roomId);

        // Join the new room via socket (backend will also auto-join via room:created handler)
        newSocket.emit('room:join', roomId);

        // Also emit room:created to backend for auto-join
        newSocket.emit('room:created', roomData);

        // Only re-fetch if room doesn't exist in contacts
        if (!roomExists) {
          // Re-fetch rooms to get the updated list
          const roomsResponse = await fetch("/api/chat/rooms", { credentials: "include" });
          if (roomsResponse.ok) {
            const { rooms = [] } = await roomsResponse.json();
            const currentUserIdStrForFormat = currentUser?.id?.toString() || currentUserIdStr;

            const formattedRooms = rooms.map((room: any) => {
              const isGroup = room.type === "group";
              const participants = room.participants || [];

              const otherParticipants = participants.filter((p: any) => {
                const pId = p._id?.toString ? p._id.toString() : p._id;
                return pId !== currentUserIdStrForFormat;
              });

              let roomName: string;
              if (isGroup) {
                roomName = room.name || "Unnamed Group";
              } else {
                // For private chats, show only the OTHER participant's name (not all participants)
                if (otherParticipants.length === 1) {
                  roomName = otherParticipants[0].username || otherParticipants[0].email || "Unknown";
                } else if (otherParticipants.length > 1) {
                  roomName = otherParticipants.map((p: any) => p.username || p.email || "Unknown").join(", ");
                } else {
                  roomName = "Private Chat";
                }
              }

              let roomAvatar = "";
              if (isGroup) {
                roomAvatar = room.avatar || "";
              } else {
                if (otherParticipants.length > 0) {
                  roomAvatar = otherParticipants[0].avatar || "";
                }
              }

              const lastMessageText = room.lastMessage?.content || "";

              return {
                id: room._id,
                name: roomName,
                avatar: roomAvatar,
                lastMessage: lastMessageText,
                isOnline: otherParticipants.some((p: any) => p.status === "online") || false,
                unreadCount: room.unreadCount || 0,
                isGroup,
                participants: room.participants || [],
              };
            });
            setContacts(formattedRooms);
          }
        }

        // Select the new room, and close sidebar on mobile
        setSelectedContactId(roomId);
        if (isMobile) {
          setIsSidebarOpen(false);
        }

      } catch (error) {
        console.error("Error handling room creation:", error);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []); // isMobile is not a dependency here as it's a fixed value after mount.

  // Load messages when room is selected
  useEffect(() => {
    if (!selectedContactId) return;

    // If messages are already loaded for this room, don't fetch again
    if (messages[selectedContactId]) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chat/rooms/${selectedContactId}/messages`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const formattedMessages = (data.messages || []).map((msg: any) => ({
            id: msg._id,
            content: msg.content,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            senderId: msg.sender._id,
            senderName: msg.sender.username,
            readBy: msg.readBy || [],
            createdAt: msg.createdAt,
          }));
          setMessages((prev) => ({
            ...prev,
            [selectedContactId]: formattedMessages,
          }));
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedContactId]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || null;
  const currentMessages = selectedContactId ? messages[selectedContactId] || [] : [];

  const handleSendMessage = (content: string) => {
    if (!selectedContactId || !socket || !currentUser) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Optimistic update - add message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: trimmedContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      senderId: currentUser.id,
      senderName: currentUser.username,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), optimisticMessage],
    }));

    // Send to server
    socket.emit("message:send", {
      roomId: selectedContactId,
      content: trimmedContent,
    });

    // Remove optimistic message if error occurs (handled by message:error event)
    socket.once("message:error", () => {
      setMessages((prev) => ({
        ...prev,
        [selectedContactId]: (prev[selectedContactId] || []).filter((msg) => msg.id !== tempId),
      }));
    });
  };

  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleCreateChat = async (username: string) => {
    try {
      const response = await fetch("/api/chat/rooms/private-by-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetUsername: username }),
      });

      if (response.ok) {
        const data = await response.json();
        const room = data.room;
        const participants = room.participants || [];
        const currentUserIdStr = currentUser?.id?.toString();

        // Extract other participant's name for private chat
        const otherParticipants = participants.filter((p: any) => {
          const pId = p._id?.toString ? p._id.toString() : p._id;
          return pId !== currentUserIdStr;
        });

        // For private chats, show only the OTHER participant's name (single participant)
        const roomName = otherParticipants.length === 1
          ? (otherParticipants[0].username || otherParticipants[0].email || "Unknown")
          : otherParticipants.length > 1
            ? otherParticipants.map((p: any) => p.username || p.email || "Unknown").join(", ")
            : username; // Fallback to searched username

        // For private chats, always use the other participant's avatar
        const roomAvatar = otherParticipants.length > 0
          ? (otherParticipants[0].avatar || "")
          : "";

        // Check if room already exists in contacts to prevent duplicates
        const roomExists = contacts.some(c => c.id === room._id);

        if (!roomExists) {
          const newRoom = {
            id: room._id,
            name: roomName,
            avatar: roomAvatar,
            lastMessage: "",
            isOnline: otherParticipants.some((p: any) => p.status === "online") || false,
            unreadCount: 0,
            isGroup: false,
            participants: room.participants || [],
          };
          setContacts((prev) => [newRoom, ...prev]);
        }
        setSelectedContactId(room._id);

        // IMPORTANT: Join the new room via socket for real-time messaging
        if (socket) {
          socket.emit('room:join', room._id);
        }

        if (isMobile) {
          setIsSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleCreateGroup = async (name: string, description: string, participantIds: string[] = []) => {
    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          description,
          type: "group",
          participants: participantIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newGroup = {
          id: data.room._id,
          name: data.room.name,
          avatar: data.room.avatar || "",
          lastMessage: description || "Group created",
          isOnline: true,
          unreadCount: 0,
          isGroup: true,
          participants: data.room.participants || [],
        };
        setContacts((prev) => [newGroup, ...prev]);
        setSelectedContactId(newGroup.id);

        // IMPORTANT: Join the new room via socket for real-time messaging
        if (socket) {
          socket.emit('room:join', data.room._id);
        }

        if (isMobile) {
          setIsSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-foreground mb-2">Connecting to chat server...</p>
          {connectError && <p className="text-sm text-red-500 mb-2">{connectError}</p>}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  const chatSidebar = (
    <ChatSidebar
      contacts={contacts}
      selectedContactId={selectedContactId}
      onSelectContact={handleSelectContact}
      onNewChat={() => setIsNewChatModalOpen(true)}
      onNewGroup={() => setIsNewGroupModalOpen(true)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      currentUser={currentUser || undefined}
    />
  );

  const chatArea = (
    <ChatArea
      selectedContact={selectedContact}
      messages={currentMessages}
      currentUserId={currentUser?.id || ""}
      onSendMessage={handleSendMessage}
      socket={socket}
      isMobile={isMobile}
      onOpenSidebar={() => setIsSidebarOpen(true)}
    />
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile Layout: Sidebar in a Sheet, ChatArea always present */}
          <Sheet
            open={!selectedContactId || isSidebarOpen}
            onOpenChange={setIsSidebarOpen}
          >
            <SheetContent
              side="left"
              className="w-3/4 max-w-sm p-0 sm:w-80"
            >
              {chatSidebar}
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            {chatArea}
          </div>
        </>
      ) : (
        <>
          {/* Desktop/Tablet Layout: Side-by-side */}
          {chatSidebar}
          {chatArea}
        </>
      )}

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreateChat={handleCreateChat}
      />
      <NewGroupModal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}