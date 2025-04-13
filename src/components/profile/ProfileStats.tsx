
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Game {
  id: string;
  created: string;
  playerNames?: string[];
  players?: string[];
  winner?: string;
  scores?: Record<string, number>;
}

interface ProfileStatsProps {
  totalGames: number;
  wins: number;
  winRatio: number;
  games: Game[];
  isLoading: boolean;
  username?: string;
  name?: string;
}

const ProfileStats = ({ 
  totalGames, 
  wins, 
  winRatio, 
  games, 
  isLoading, 
  username, 
  name 
}: ProfileStatsProps) => {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('is-IS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const displayName = name || username;

  return (
    <>
      {isLoading ? (
        <p>Hleð tölfræði...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-game-dark/50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Leikir spilaðir</p>
              <p className="text-2xl font-bold text-game-accent-blue">{totalGames || 0}</p>
            </div>
            <div className="bg-game-dark/50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Sigrar</p>
              <p className="text-2xl font-bold text-game-accent-green">{wins || 0}</p>
            </div>
            <div className="bg-game-dark/50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Sigurhlutfall</p>
              <p className="text-2xl font-bold text-game-accent-purple">{winRatio || 0}%</p>
            </div>
          </div>
          
          {games && games.length > 0 ? (
            <div className="rounded-md border border-game-accent-blue/20">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-game-accent-blue">Dagsetning</TableHead>
                      <TableHead className="text-game-accent-blue">Spilarar</TableHead>
                      <TableHead className="text-game-accent-blue">Úrslit</TableHead>
                      <TableHead className="text-right text-game-accent-blue">Stig</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map((game: Game) => (
                      <TableRow key={game.id} className="hover:bg-game-dark/50">
                        <TableCell>{formatDate(game.created)}</TableCell>
                        <TableCell>{game.playerNames?.join(', ') || game.players?.join(', ') || '-'}</TableCell>
                        <TableCell>
                          {game.winner === displayName ? (
                            <span className="text-game-accent-green font-medium">Þú vannst!</span>
                          ) : (
                            <span>{game.winner || 'Óþekkt'} vann</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {game.scores && displayName ? game.scores[displayName] || 0 : 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Engin leikjasaga fundist.</p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ProfileStats;
