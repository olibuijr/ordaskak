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
import { getUsersByIds } from "@/services/users";
import { toast } from "@/components/ui/use-toast";

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
  
  const isValidPlayerId = (id: any): boolean => {
    return typeof id === 'string' && id.length > 0;
  };
  
  useEffect(() => {
    const fetchPlayerNames = async () => {
      const playerIds = new Set<string>();
      
      [...activeGames, ...completedGames].forEach(game => {
        if (game.players && Array.isArray(game.players)) {
          game.players.forEach(playerId => {
            if (isValidPlayerId(playerId) && !playerNameCache[playerId]) {
              playerIds.add(playerId);
            }
          });
        }
      });
      
      if (playerIds.size === 0) {
        console.log("No player IDs to fetch");
        return;
      }
      
      const playerIdsArray = Array.from(playerIds);
      console.log("Need to fetch these player IDs:", playerIdsArray);
      
      setIsLoading(true);
      try {
        const users = await getUsersByIds(playerIdsArray);
        console.log("Received user data:", users);
        
        if (users && users.length > 0) {
          const newPlayerNames: Record<string, string> = {};
          users.forEach(user => {
            if (user && user.id) {
              newPlayerNames[user.id] = user.name || user.username || 'Unknown Player';
              console.log(`Mapped ${user.id} to ${newPlayerNames[user.id]}`);
            }
          });
          
          setPlayerNameCache(prev => ({ ...prev, ...newPlayerNames }));
        } else {
          console.error("No user data returned from getUsersByIds");
          toast({
            title: "Villa",
            description: "Ekki tókst að sækja notendanöfn.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching player names:", error);
        toast({
          title: "Villa",
          description: "Villa kom upp við að sækja notendanöfn.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    const hasPlayers = [...activeGames, ...completedGames].some(
      game => game.players && game.players.length > 0
    );
    
    if (hasPlayers) {
      fetchPlayerNames();
    }
  }, [activeGames, completedGames]);
  
  const formatPlayersList = (players: string[]) => {
    if (!players || players.length === 0) {
      return "No players";
    }
    
    return players.map(playerId => {
      if (!isValidPlayerId(playerId)) {
        return playerId;
      }
      
      if (playerNameCache[playerId]) {
        return playerNameCache[playerId];
      }
      
      return isLoading ? "Hleður..." : "Player-" + playerId.substring(0, 5);
    }).join(', ');
  };
  
  useEffect(() => {
    console.log("Player name cache updated:", playerNameCache);
    console.log("Active games:", activeGames);
    
    if (activeGames.length > 0) {
      const firstGame = activeGames[0];
      console.log("First game players:", firstGame.players);
      
      if (firstGame.players && firstGame.players.length > 0) {
        firstGame.players.forEach(playerId => {
          console.log(`Player ID: ${playerId}, Cached name: ${playerNameCache[playerId] || 'Not cached'}`);
        });
      }
    }
  }, [playerNameCache, activeGames]);
  
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
                          const playerNames = game.players.map(playerId => {
                            if (!isValidPlayerId(playerId)) {
                              return playerId;
                            }
                            return playerNameCache[playerId] || `Player-${playerId.substring(0, 5)}`;
                          });
                          
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
