import { Moon, Users, MessageCirclePlus, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  isOnline: boolean;
  unreadCount?: number;
}

interface ChatSidebarProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ChatSidebar({
  contacts,
  selectedContactId,
  onSelectContact,
  onNewChat,
  onNewGroup,
  searchQuery,
  onSearchChange,
}: ChatSidebarProps) {
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[25rem] flex flex-col h-full border-r border-border bg-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-sidebar-foreground">RequestApp</h1>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-sidebar-accent">
              <Moon className="h-5 w-5 text-sidebar-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-full hover:bg-sidebar-accent"
              onClick={onNewGroup}
            >
              <Users className="h-5 w-5 text-sidebar-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-full hover:bg-sidebar-accent"
              onClick={onNewChat}
            >
              <MessageCirclePlus className="h-5 w-5 text-sidebar-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search or start new chat..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full py-2 pl-10 rounded-xl bg-secondary border-0"
          />
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onSelectContact(contact.id)}
            className={`flex items-center space-x-3 p-4 cursor-pointer border-b border-border transition-colors hover:bg-sidebar-accent ${
              selectedContactId === contact.id ? "bg-sidebar-accent" : ""
            }`}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground overflow-hidden">
                {contact.avatar ? (
                  <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                ) : (
                  contact.name.charAt(0).toUpperCase()
                )}
              </div>
              {contact.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-online border-2 border-sidebar" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sidebar-foreground truncate">{contact.name}</p>
              {contact.lastMessage && (
                <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
              )}
            </div>
            {contact.unreadCount && contact.unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                {contact.unreadCount}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
              JD
            </div>
            <div>
              <p className="font-semibold text-sidebar-foreground">John Doe</p>
              <p className="text-sm text-muted-foreground">My Profile</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-sidebar-accent">
            <LogOut className="h-5 w-5 text-sidebar-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
