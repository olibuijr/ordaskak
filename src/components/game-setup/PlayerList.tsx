
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { getAvatarUrl } from "@/utils/avatarUtils";

interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string | null;
}

interface PlayerListProps {
  players: UserData[];
  onRemovePlayer: (id: string) => void;
}

const PlayerList = ({ players, onRemovePlayer }: PlayerListProps) => {
  if (players.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Valdir spilarar</h4>
      {players.map((player) => (
        <div key={player.id} className="flex justify-between items-center p-2 bg-game-dark/30 rounded-md">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 border border-game-accent-blue/30">
              <AvatarImage 
                src={player.avatar || getAvatarUrl(player.id)} 
                alt={player.username} 
              />
              <AvatarFallback className="bg-game-dark text-game-accent-purple">
                {player.username?.charAt(0).toUpperCase() || <UserCircle />}
              </AvatarFallback>
            </Avatar>
            <span>{player.name || player.username}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onRemovePlayer(player.id)}
            className="text-red-400 hover:text-red-500 hover:bg-transparent"
          >
            Fjarlægja
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
