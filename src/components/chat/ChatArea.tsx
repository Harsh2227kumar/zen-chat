import { useState } from "react";
import { Send, ChevronDown, Info, Menu } from "lucide-react"; // ADDED Menu for mobile sidebar toggle
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
import { Textarea } from "@/components/ui/textarea";

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
  // ADDED responsive props below:
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

export function ChatArea({
  selectedContact,
  messages,
  currentUserId,
  onSendMessage,
  isTyping = false,
  socket,
  // ADDED responsive props below:
  isMobile = false,
  onOpenSidebar,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  if (!selectedContact) {
    // If on mobile and no contact is selected, the sidebar Sheet is visible (handled in Index.tsx).
    // Return an empty div here to prevent the welcome screen from showing behind the sheet.
    if (isMobile) {
      return <div className="flex-1" />;
    }

    // Desktop/Tablet welcome screen
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
        {isMobile && onOpenSidebar && ( // ADDED: Mobile menu button to open sidebar
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
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
              className={`flex ${isSent ? "justify-end" : "justify-start"}`}
            >
              <div
                // Responsive Max Width: Caps at 500px on large screens, dynamic on small screens
                className={`relative group px-4 pt-3 pb-6 rounded-xl shadow-sm max-w-[calc(100vw-120px)] sm:max-w-[400px] md:max-w-[500px] ${isSent
                    ? "bg-message-sent text-primary-foreground rounded-br-none"
                    : "bg-message-received text-foreground rounded-bl-none"
                  }`}
              >
                {!isSent && message.senderName && (
                  <p className="text-xs font-semibold mb-1 text-primary">{message.senderName}</p>
                )}

                {/* Message Content: 'whitespace-pre-wrap' ensures line breaks are respected */}
                <p className="text-sm sm:text-base break-words whitespace-pre-wrap pr-12">
                  {message.content}
                </p>

                {/* Timestamp/Dropdown: Absolutely positioned at bottom-right */}
                <div className="absolute bottom-1 right-2 flex items-center space-x-1">
                  <p
                    className={`text-[10px] ${isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                  >
                    {message.timestamp}
                  </p>
                  {isSent && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 ${isSent ? "text-primary-foreground/70" : "text-muted-foreground"
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
          {/* Textarea for multiline support and key handling for submission */}
          <Textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-xl resize-none min-h-[44px] max-h-[150px] p-3 border-0 bg-secondary"
          />
          <Button type="submit" className="px-6 py-3 rounded-xl">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}