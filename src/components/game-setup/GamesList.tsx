
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
                    <TableCell>{game.players.join(', ')}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onStartGame(
                          game.players.length,
                          game.players,
                          game.id
                        )}
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
                    <TableCell>{game.players.join(', ')}</TableCell>
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
