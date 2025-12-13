import { useState, useEffect, useRef } from "react";
import { X, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  status: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (username: string) => void;
}

export function NewChatModal({ isOpen, onClose, onCreateChat }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/users/search?q=${encodeURIComponent(searchQuery.trim())}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users || []);
          if (data.users && data.users.length === 0) {
            setSearchError("User not found");
          } else {
            setSearchError(null);
          }
        } else {
          setSearchError("User not found");
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchError("Error searching for user");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUserClick = (user: User) => {
    onCreateChat(user.username);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div ref={modalRef} className="relative bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-card-foreground">New Chat</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-card-foreground block mb-2">
              Username or Email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter username or email"
                className="w-full pl-10 pr-4 py-2 rounded-xl"
                autoFocus
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              {isSearching && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              )}

              {!isSearching && searchError && searchResults.length === 0 && (
                <div className="p-4 text-center text-sm text-destructive">
                  {searchError}
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="divide-y divide-border">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center space-x-3 p-4 hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground overflow-hidden">
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
                        {user.status === "online" && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-online border-2 border-card" />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-card-foreground truncate">
                          {user.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Message Button */}
                      <Button
                        size="sm"
                        className="flex-shrink-0 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(user);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}