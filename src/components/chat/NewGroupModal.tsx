import { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, X as XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  status: string;
}

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, description: string, participantIds: string[]) => void;
}

export function NewGroupModal({ isOpen, onClose, onCreateGroup }: NewGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setDescription("");
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchResults(false);
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
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/users/search?q=${encodeURIComponent(searchQuery.trim())}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Filter out already selected users
          const filteredUsers = (data.users || []).filter(
            (user: User) => !selectedUsers.some((selected) => selected._id === user._id)
          );
          setSearchResults(filteredUsers);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
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
  }, [searchQuery, selectedUsers]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    if (isOpen && showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, showSearchResults]);

  if (!isOpen) return null;

  const handleAddUser = (user: User) => {
    if (!selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery("");
      setShowSearchResults(false);
      searchInputRef.current?.focus();
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      const participantIds = selectedUsers.map((user) => user._id);
      onCreateGroup(groupName.trim(), description.trim(), participantIds);
      setGroupName("");
      setDescription("");
      setSelectedUsers([]);
      setSearchQuery("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div ref={modalRef} className="relative bg-card rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-card-foreground">Create Group</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="text-sm font-medium text-card-foreground block mb-2">
              Group Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-2 rounded-xl"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-card-foreground block mb-2">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              className="w-full px-4 py-2 rounded-xl resize-none"
              rows={3}
            />
          </div>

          {/* Add Members Section */}
          <div>
            <label className="text-sm font-medium text-card-foreground block mb-2">
              Add Members
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                placeholder="Search by username or email"
                className="w-full pl-10 pr-4 py-2 rounded-xl"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {isSearching && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  )}

                  {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div className="divide-y divide-border">
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center space-x-3 p-3 hover:bg-accent transition-colors cursor-pointer"
                          onClick={() => handleAddUser(user)}
                        >
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
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-card-foreground truncate">
                              {user.username}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          <UserPlus className="h-5 w-5 text-primary flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="text-sm font-medium text-card-foreground block mb-2">
                Selected Members ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-xl min-h-[60px]">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-2 bg-card border border-border rounded-full px-3 py-1.5 group hover:border-primary transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground overflow-hidden flex-shrink-0">
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
                    <span className="text-sm font-medium text-card-foreground">{user.username}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user._id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                      aria-label={`Remove ${user.username}`}
                    >
                      <XIcon className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={!groupName.trim()}
            >
              Create Group {selectedUsers.length > 0 && `(${selectedUsers.length + 1})`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}