
import { Player } from "@/utils/gameLogic";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScoreBoardProps {
  players: Player[];
  tilesRemaining: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, tilesRemaining }) => {
  return (
    <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((player) => (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-3 rounded-md ${
                player.isActive 
                  ? 'bg-game-accent-blue/20 border border-game-accent-blue/40' 
                  : 'bg-game-dark/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  player.isActive ? 'bg-game-accent-blue animate-pulse' : 'bg-gray-500'
                }`} />
                <span className="font-semibold">{player.name}</span>
                {player.isAI && <Badge variant="outline" className="text-xs">AI</Badge>}
              </div>
              <div className="text-xl font-bold text-game-accent-blue">
                {player.score}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-between border-t border-game-accent-blue/20 pt-4">
          <span className="text-muted-foreground">Tiles remaining</span>
          <span className="font-semibold">{tilesRemaining}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreBoard;
