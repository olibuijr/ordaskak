
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Users, Brain, UserCircle } from 'lucide-react';

interface GameSetupProps {
  onStartGame: (playerCount: number, playerNames: string[]) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'AI 1', 'AI 2', 'AI 3']);
  
  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[450px] max-w-full bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-game-accent-blue to-game-accent-purple">
            Orðaskák
          </CardTitle>
          <p className="text-muted-foreground mt-2">Futuristic Icelandic Word Game</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Number of Players ({playerCount})</label>
              <div className="flex gap-2 text-muted-foreground text-sm">
                <span>1</span>
                <span>4</span>
              </div>
            </div>
            <Slider 
              value={[playerCount]} 
              min={1} 
              max={4} 
              step={1} 
              onValueChange={(val) => setPlayerCount(val[0])} 
              className="my-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium mb-2">Player Names</h3>
            
            {/* Human player */}
            <div className="flex items-center space-x-3">
              <UserCircle className="h-5 w-5 text-game-accent-blue" />
              <Input
                value={playerNames[0]}
                onChange={(e) => handleNameChange(0, e.target.value)}
                className="bg-game-dark/60"
                placeholder="Your name"
              />
            </div>
            
            {/* AI players based on count */}
            {Array.from({ length: Math.min(playerCount - 1, 3) }).map((_, i) => (
              <div key={i + 1} className="flex items-center space-x-3">
                <Brain className="h-5 w-5 text-game-accent-purple" />
                <Input
                  value={playerNames[i + 1]}
                  onChange={(e) => handleNameChange(i + 1, e.target.value)}
                  className="bg-game-dark/60"
                  placeholder={`AI ${i + 1}`}
                />
              </div>
            ))}
          </div>
          
          <Button 
            onClick={() => onStartGame(
              playerCount, 
              playerNames.slice(0, playerCount)
            )}
            className="w-full bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
          >
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetup;
