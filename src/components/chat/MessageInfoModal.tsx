import { X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: string;
    content: string;
    timestamp: string;
    senderId: string;
    senderName?: string;
    readBy?: Array<{ user: string | { _id: string; username: string; avatar?: string }; readAt: string }>;
    createdAt?: string;
  } | null;
  roomType: "private" | "group";
  roomParticipants?: Array<{ _id: string; username: string; avatar?: string }>;
  currentUserId: string;
}

export function MessageInfoModal({
  isOpen,
  onClose,
  message,
  roomType,
  roomParticipants = [],
  currentUserId,
}: MessageInfoModalProps) {
  if (!message) return null;

  // Format readBy data
  const readByUsers = (message.readBy || []).map((read) => {
    if (typeof read.user === "string") {
      // If it's just an ID, find the participant
      const participant = roomParticipants.find((p) => p._id === read.user);
      return {
        userId: read.user,
        username: participant?.username || "Unknown",
        avatar: participant?.avatar || "",
        readAt: read.readAt,
      };
    } else {
      // If it's populated
      return {
        userId: read.user._id,
        username: read.user.username || "Unknown",
        avatar: read.user.avatar || "",
        readAt: read.readAt,
      };
    }
  });

  // For private chats
  if (roomType === "private") {
    const otherParticipant = roomParticipants.find((p) => p._id !== currentUserId);
    const isRead = readByUsers.some((r) => r.userId === otherParticipant?._id);
    const isDelivered = true; // Assume delivered if message exists

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message Info</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Message</p>
              <p className="text-foreground">{message.content}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Sent</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(message.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Delivered</p>
                  <p className="text-sm text-muted-foreground">
                    {isDelivered ? "Delivered" : "Pending"}
                  </p>
                </div>
              </div>

              {isRead && (
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Seen</p>
                    <p className="text-sm text-muted-foreground">
                      {readByUsers[0]?.readAt
                        ? new Date(readByUsers[0].readAt).toLocaleString()
                        : "Just now"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For group chats
  const seenUsers = readByUsers.filter((r) => r.userId !== message.senderId);
  const notSeenUsers = roomParticipants.filter(
    (p) =>
      p._id !== message.senderId &&
      p._id !== currentUserId &&
      !readByUsers.some((r) => r.userId === p._id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Message Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Message</p>
            <p className="text-foreground">{message.content}</p>
          </div>

          {seenUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center space-x-2">
                <CheckCheck className="h-4 w-4 text-primary" />
                <span>Seen by {seenUsers.length}</span>
              </p>
              <div className="space-y-2">
                {seenUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center space-x-3 p-2 bg-muted rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.readAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notSeenUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center space-x-2">
                <Check className="h-4 w-4 text-muted-foreground" />
                <span>Delivered to {notSeenUsers.length}</span>
              </p>
              <div className="space-y-2">
                {notSeenUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-3 p-2 bg-muted rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{user.username}</p>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {seenUsers.length === 0 && notSeenUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No delivery information available
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}