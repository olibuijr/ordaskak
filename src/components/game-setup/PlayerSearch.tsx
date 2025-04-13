
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import { searchUsers } from "@/services/users";
import { getAvatarUrl } from "@/utils/avatarUtils";

interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string | null;
}

interface PlayerSearchProps {
  onSelectUser: (user: UserData) => void;
  selectedUsers: UserData[];
  currentUserId?: string;
}

const PlayerSearch = ({ onSelectUser, selectedUsers, currentUserId }: PlayerSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      const filteredResults = results.filter(
        result => !selectedUsers.some(u => u.id === result.id) && result.id !== currentUserId
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      // Error handled in service
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 300);
      
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-game-dark/60"
          placeholder="Leita að öðrum spilurum"
        />
        <Button 
          onClick={handleSearch}
          className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
          disabled={isSearching || searchQuery.length < 2}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="absolute mt-1 w-full z-10 bg-game-dark rounded-md shadow-lg max-h-60 overflow-auto">
          <ScrollArea className="p-1">
            {searchResults.map((result) => (
              <div 
                key={result.id}
                className="p-2 hover:bg-game-accent-blue/20 cursor-pointer rounded-sm flex items-center space-x-3"
                onClick={() => onSelectUser(result)}
              >
                <Avatar className="h-8 w-8 border border-game-accent-blue/30">
                  <AvatarImage 
                    src={result.avatar || getAvatarUrl(result.id)} 
                    alt={result.username} 
                  />
                  <AvatarFallback className="bg-game-dark text-game-accent-purple">
                    {result.username?.charAt(0).toUpperCase() || <UserCircle />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{result.name || result.username}</p>
                  <p className="text-sm text-muted-foreground truncate">{result.email}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default PlayerSearch;
