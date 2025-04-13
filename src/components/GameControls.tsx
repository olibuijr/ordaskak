
import { Button } from "@/components/ui/button";
import { Player } from "@/utils/gameLogic";
import { Shuffle, SkipForward, RotateCcw, Play } from "lucide-react";

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
  return (
    <div className="flex flex-col gap-2 md:flex-row md:gap-4 justify-center mt-4">
      <Button 
        variant="default" 
        onClick={onPlayWord}
        disabled={!canPlay}
        className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black flex gap-2"
      >
        <Play size={18} />
        <span>Play Word</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onShuffleTiles}
        className="border-game-accent-blue text-game-accent-blue hover:bg-game-accent-blue/20 flex gap-2"
      >
        <Shuffle size={18} />
        <span>Shuffle</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onRecallTiles}
        className="border-game-accent-purple text-game-accent-purple hover:bg-game-accent-purple/20 flex gap-2"
      >
        <RotateCcw size={18} />
        <span>Recall</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onPassTurn}
        className="border-game-accent-pink text-game-accent-pink hover:bg-game-accent-pink/20 flex gap-2"
      >
        <SkipForward size={18} />
        <span>Pass</span>
      </Button>
    </div>
  );
};

export default GameControls;
