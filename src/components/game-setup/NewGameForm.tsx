import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { List, UserCircle } from "lucide-react";
import PlayerSearch from "./PlayerSearch";
import PlayerList from "./PlayerList";
import { getAvatarUrl } from "@/utils/avatarUtils";

interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string | null;
}

interface NewGameFormProps {
  onBackToList: () => void;
  onCreateGame: () => void;
  isCreating: boolean;
  user: any;
  onSelectUser: (user: UserData) => void;
  onRemoveUser: (userId: string) => void;
  selectedUsers: UserData[];
}

const NewGameForm = ({
  onBackToList,
  onCreateGame,
  isCreating,
  user,
  onSelectUser,
  onRemoveUser,
  selectedUsers
}: NewGameFormProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={onBackToList}
          className="text-game-accent-blue"
        >
          <List className="mr-2 h-4 w-4" />
          Sýna leiki
        </Button>
        <h3 className="text-lg font-medium">Nýr leikur</h3>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium mb-2">Spilarar</h3>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-game-accent-blue/30">
            <AvatarImage 
              src={user?.id ? getAvatarUrl(user.id) : ''} 
              alt={user?.username} 
            />
            <AvatarFallback className="bg-game-dark text-game-accent-blue">
              {user?.username?.charAt(0).toUpperCase() || <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <Input
            value={user?.name || user?.username || 'Notandi'}
            readOnly
            className="bg-game-dark/60 cursor-default"
            placeholder="Þitt nafn"
          />
        </div>
        
        <div className="space-y-4 mt-4">
          <PlayerSearch 
            onSelectUser={onSelectUser} 
            selectedUsers={selectedUsers}
            currentUserId={user?.id}
          />
          
          <PlayerList 
            players={selectedUsers}
            onRemovePlayer={onRemoveUser}
          />
        </div>
      </div>
      
      <Button 
        onClick={onCreateGame}
        disabled={isCreating}
        className="w-full bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
      >
        {isCreating ? "Hleð..." : "Hefja leik"}
      </Button>
    </div>
  );
};

export default NewGameForm;
