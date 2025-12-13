import { useState } from "react";
import { Send, ChevronDown, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageInfoModal } from "./MessageInfoModal";
import { Socket } from "socket.io-client";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  readBy?: Array<{ user: string | { _id: string; username: string; avatar?: string }; readAt: string }>;
  createdAt?: string;
}

interface ChatAreaProps {
  selectedContact: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    isGroup?: boolean;
    participants?: Array<{ _id: string; username: string; avatar?: string }>;
  } | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
  socket: Socket | null;
}

export function ChatArea({
  selectedContact,
  messages,
  currentUserId,
  onSendMessage,
  isTyping = false,
  socket,
}: ChatAreaProps) {
  const [messageContent, setMessageContent] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageContent.trim()) {
      onSendMessage(messageContent.trim());
      setMessageContent("");
    }
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <span className="text-6xl mb-4">💬</span>
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to RequestApp</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Select a conversation from the sidebar to start chatting, or create a new chat to connect with someone.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground overflow-hidden">
            {selectedContact.avatar ? (
              <img src={selectedContact.avatar} alt={selectedContact.name} className="w-full h-full object-cover" />
            ) : (
              selectedContact.name.charAt(0).toUpperCase()
            )}
          </div>
          {selectedContact.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-online border-2 border-background" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{selectedContact.name}</h3>
          <p className="text-sm text-muted-foreground">
            {selectedContact.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isSent = message.senderId === currentUserId;
          
          return (
            <div
              key={message.id}
              className={`flex ${isSent ? "justify-end" : "justify-start"} items-end`}
            >
              <div className={`flex items-end space-x-2 ${isSent ? "flex-row-reverse space-x-reverse" : ""}`}>
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl relative group ${
                    isSent
                      ? "bg-message-sent text-primary-foreground"
                      : "bg-message-received text-foreground"
                  }`}
                >
                  {!isSent && message.senderName && (
                    <p className="text-xs font-semibold mb-1 text-primary">{message.senderName}</p>
                  )}
                  <p className="break-words">{message.content}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <p
                      className={`text-xs ${
                        isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                    {isSent && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 ${
                              isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMessage(message);
                              setIsMessageInfoOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Info className="h-4 w-4 mr-2" />
                            Message Info
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Info Modal */}
      <MessageInfoModal
        isOpen={isMessageInfoOpen}
        onClose={() => {
          setIsMessageInfoOpen(false);
          setSelectedMessage(null);
        }}
        message={selectedMessage}
        roomType={selectedContact?.isGroup ? "group" : "private"}
        roomParticipants={selectedContact?.participants || []}
        currentUserId={currentUserId}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-4 py-2">
          <p className="text-sm italic text-muted-foreground">
            {selectedContact.name} is typing...
          </p>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Input
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full px-5 py-3 bg-secondary border-0"
          />
          <Button type="submit" className="px-6 py-3 rounded-full">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
