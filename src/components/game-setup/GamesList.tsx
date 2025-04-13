
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Play, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserById, getUsersByIds } from "@/services/users";

interface GameData {
  id: string;
  created: string;
  players: string[];
  isActive: boolean;
  yourScore?: number;
  winner?: string;
  userId: string;
  name?: string;
}

interface GamesListProps {
  activeGames: GameData[];
  completedGames: GameData[];
  onStartGame: (playerCount: number, playerNames: string[], gameId?: string) => void;
  currentUserName?: string;
  formatDate: (dateString: string) => string;
}

const GamesList = ({ 
  activeGames, 
  completedGames, 
  onStartGame, 
  currentUserName,
  formatDate 
}: GamesListProps) => {
  const [playerNameCache, setPlayerNameCache] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchPlayerNames = async () => {
      const playerIds = new Set<string>();
      
      [...activeGames, ...completedGames].forEach(game => {
        if (game.players && Array.isArray(game.players)) {
          game.players.forEach(playerId => {
            if (typeof playerId === 'string' && playerId.length <= 36 && !playerNameCache[playerId]) {
              playerIds.add(playerId);
            }
          });
        }
      });
      
      if (playerIds.size === 0) return;
      
      setIsLoading(true);
      try {
        // Use batch fetch for better performance
        const playerIdsArray = Array.from(playerIds);
        const users = await getUsersByIds(playerIdsArray);
        
        const newPlayerNames: Record<string, string> = {};
        users.forEach(user => {
          if (user) {
            newPlayerNames[user.id] = user.name || user.username || 'Unknown Player';
          }
        });
        
        setPlayerNameCache(prev => ({ ...prev, ...newPlayerNames }));
      } catch (error) {
        console.error("Error fetching player names:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayerNames();
  }, [activeGames, completedGames]);
  
  const formatPlayersList = (players: string[]) => {
    if (!players || players.length === 0) {
      return "No players";
    }
    
    return players.map(playerId => {
      // Check if this is already a name and not an ID
      if (playerId.length > 36 || !playerId.includes('-')) {
        return playerId;
      }
      
      return playerNameCache[playerId] || 'Loading...';
    }).join(', ');
  };
  
  return (
    <>
      {activeGames.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center">
            <Play className="mr-2 h-5 w-5 text-game-accent-green" />
            Virk spil ({activeGames.length})
          </h3>
          <ScrollArea className="h-[180px] rounded-md border border-game-accent-blue/20 bg-game-dark/30">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-game-accent-blue">Dagsetning</TableHead>
                  <TableHead className="text-game-accent-blue">Spilarar</TableHead>
                  <TableHead className="text-right text-game-accent-blue">Aðgerðir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeGames.map((game) => (
                  <TableRow key={game.id} className="hover:bg-game-dark/50">
                    <TableCell>{formatDate(game.created)}</TableCell>
                    <TableCell>{formatPlayersList(game.players)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const playerNames = game.players.map(playerId => 
                            playerNameCache[playerId] || 'Unknown Player'
                          );
                          onStartGame(
                            game.players.length,
                            playerNames,
                            game.id
                          );
                        }}
                        className="border-game-accent-blue/50 text-game-accent-blue hover:bg-game-accent-blue/20"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Halda áfram
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
      
      {completedGames.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center">
            <Check className="mr-2 h-5 w-5 text-game-accent-purple" />
            Kláraðir leikir ({completedGames.length})
          </h3>
          <ScrollArea className="h-[180px] rounded-md border border-game-accent-blue/20 bg-game-dark/30">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-game-accent-blue">Dagsetning</TableHead>
                  <TableHead className="text-game-accent-blue">Spilarar</TableHead>
                  <TableHead className="text-game-accent-blue">Úrslit</TableHead>
                  <TableHead className="text-right text-game-accent-blue">Stig þín</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedGames.map((game) => (
                  <TableRow key={game.id} className="hover:bg-game-dark/50">
                    <TableCell>{formatDate(game.created)}</TableCell>
                    <TableCell>{formatPlayersList(game.players)}</TableCell>
                    <TableCell>
                      {game.winner === currentUserName ? (
                        <span className="text-game-accent-green font-medium">Þú vannst!</span>
                      ) : (
                        <span>{game.winner} vann</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{game.yourScore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </>
  );
};

export default GamesList;
