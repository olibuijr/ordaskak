
import { Button } from "@/components/ui/button";
import { Player } from "@/utils/gameLogic";
import { Shuffle, SkipForward, RotateCcw, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface GameControlsProps {
  currentPlayer: Player;
  onPlayWord: () => void;
  onShuffleTiles: () => void;
  onPassTurn: () => void;
  onRecallTiles: () => void;
  canPlay: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  onPlayWord,
  onShuffleTiles,
  onPassTurn,
  onRecallTiles,
  canPlay
}) => {
  const { user } = useAuth();
  const isCurrentPlayerUser = user && currentPlayer.name === user.username;
  
  return (
    <div className="flex flex-col gap-2 md:flex-row md:gap-4 justify-center mt-4">
      <Button 
        variant="default" 
        onClick={onPlayWord}
        disabled={!canPlay || !isCurrentPlayerUser}
        className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black flex gap-2"
      >
        <Play size={18} />
        <span>Spila orð</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onShuffleTiles}
        disabled={!isCurrentPlayerUser}
        className="border-game-accent-blue text-game-accent-blue hover:bg-game-accent-blue/20 flex gap-2"
      >
        <Shuffle size={18} />
        <span>Blanda</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onRecallTiles}
        disabled={!isCurrentPlayerUser}
        className="border-game-accent-purple text-game-accent-purple hover:bg-game-accent-purple/20 flex gap-2"
      >
        <RotateCcw size={18} />
        <span>Taka til baka</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onPassTurn}
        disabled={!isCurrentPlayerUser}
        className="border-game-accent-pink text-game-accent-pink hover:bg-game-accent-pink/20 flex gap-2"
      >
        <SkipForward size={18} />
        <span>Sleppa</span>
      </Button>
    </div>
  );
};

export default GameControls;
