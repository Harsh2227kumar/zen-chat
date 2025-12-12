import { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { NewGroupModal } from "@/components/chat/NewGroupModal";

// Mock data
const mockContacts = [
  { id: "1", name: "Alice Johnson", avatar: "", lastMessage: "Hey, how are you?", isOnline: true, unreadCount: 2 },
  { id: "2", name: "Bob Smith", avatar: "", lastMessage: "See you tomorrow!", isOnline: false, unreadCount: 0 },
  { id: "3", name: "Team Project", avatar: "", lastMessage: "Great work everyone!", isOnline: true, unreadCount: 5 },
  { id: "4", name: "Carol White", avatar: "", lastMessage: "Thanks for your help", isOnline: true, unreadCount: 0 },
  { id: "5", name: "David Brown", avatar: "", lastMessage: "Let me check that", isOnline: false, unreadCount: 1 },
];

const mockMessages: Record<string, Array<{ id: string; content: string; timestamp: string; senderId: string; senderName?: string }>> = {
  "1": [
    { id: "m1", content: "Hey, how are you?", timestamp: "10:30 AM", senderId: "1", senderName: "Alice Johnson" },
    { id: "m2", content: "I'm doing great, thanks! How about you?", timestamp: "10:32 AM", senderId: "current" },
    { id: "m3", content: "Pretty good! Working on the new project.", timestamp: "10:33 AM", senderId: "1", senderName: "Alice Johnson" },
  ],
  "2": [
    { id: "m4", content: "Are we still meeting tomorrow?", timestamp: "Yesterday", senderId: "current" },
    { id: "m5", content: "See you tomorrow!", timestamp: "Yesterday", senderId: "2", senderName: "Bob Smith" },
  ],
  "3": [
    { id: "m6", content: "The presentation looks amazing!", timestamp: "2:00 PM", senderId: "1", senderName: "Alice Johnson" },
    { id: "m7", content: "I agree, well done team!", timestamp: "2:05 PM", senderId: "current" },
    { id: "m8", content: "Great work everyone!", timestamp: "2:10 PM", senderId: "4", senderName: "Carol White" },
  ],
};

export default function Index() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [contacts, setContacts] = useState(mockContacts);
  const [messages, setMessages] = useState(mockMessages);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || null;
  const currentMessages = selectedContactId ? messages[selectedContactId] || [] : [];

  const handleSendMessage = (content: string) => {
    if (!selectedContactId) return;
    
    const newMessage = {
      id: `m${Date.now()}`,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      senderId: "current",
    };

    setMessages((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), newMessage],
    }));
  };

  const handleCreateChat = (username: string) => {
    const newContact = {
      id: `c${Date.now()}`,
      name: username,
      avatar: "",
      lastMessage: "",
      isOnline: true,
      unreadCount: 0,
    };
    setContacts((prev) => [newContact, ...prev]);
    setSelectedContactId(newContact.id);
  };

  const handleCreateGroup = (name: string, description: string) => {
    const newGroup = {
      id: `g${Date.now()}`,
      name,
      avatar: "",
      lastMessage: description || "Group created",
      isOnline: true,
      unreadCount: 0,
    };
    setContacts((prev) => [newGroup, ...prev]);
    setSelectedContactId(newGroup.id);
  };

  return (
    <div className="flex h-screen w-full">
      <ChatSidebar
        contacts={contacts}
        selectedContactId={selectedContactId}
        onSelectContact={setSelectedContactId}
        onNewChat={() => setIsNewChatModalOpen(true)}
        onNewGroup={() => setIsNewGroupModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ChatArea
        selectedContact={selectedContact}
        messages={currentMessages}
        currentUserId="current"
        onSendMessage={handleSendMessage}
      />
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
