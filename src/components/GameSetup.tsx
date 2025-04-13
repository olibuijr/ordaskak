
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Users, Brain, UserCircle, List, Check, Play, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pb } from '@/services/pocketbase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GameSetupProps {
  onStartGame: (playerCount: number, playerNames: string[]) => void;
}

interface GameData {
  id: string;
  created: string;
  players: string[];
  isActive: boolean;
  yourScore?: number;
  winner?: string;
  user: string;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const { user } = useAuth();
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([
    user?.name || user?.username || 'Spilari 1', 
    'Tölva 1', 
    'Tölva 2', 
    'Tölva 3'
  ]);
  const [showNewGame, setShowNewGame] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch games from PocketBase
  const fetchGames = async () => {
    if (!user) return { activeGames: [], completedGames: [] };
    
    try {
      const records = await pb.collection('games').getList(1, 50, {
        filter: `user = "${user.id}"`,
        sort: '-created',
      });
      
      const games = records.items.map(item => ({
        id: item.id,
        created: item.created,
        players: item.players,
        isActive: item.isActive,
        yourScore: item.yourScore,
        winner: item.winner,
        user: item.user
      }));
      
      return {
        activeGames: games.filter(game => game.isActive),
        completedGames: games.filter(game => !game.isActive)
      };
    } catch (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
  };
  
  // Create a new game
  const createGame = async () => {
    if (!user) return null;
    
    try {
      const data = {
        players: playerNames.slice(0, playerCount),
        isActive: true,
        user: user.id
      };
      
      const record = await pb.collection('games').create(data);
      return record;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  };
  
  // Query for fetching games
  const { data: gamesData, isLoading, error } = useQuery({
    queryKey: ['games', user?.id],
    queryFn: fetchGames,
    enabled: !!user
  });
  
  // Mutation for creating a new game
  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setShowNewGame(false);
      if (data) {
        onStartGame(
          data.players.length, 
          data.players
        );
      }
      toast({
        title: "Nýr leikur",
        description: "Leikur hefur verið búinn til!",
      });
    },
    onError: (error) => {
      console.error('Error creating game:', error);
      toast({
        title: "Villa",
        description: "Ekki tókst að búa til nýjan leik.",
        variant: "destructive"
      });
    }
  });
  
  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('is-IS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // If there's an error, show a message
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[700px] max-w-full bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
          <CardContent className="p-6">
            <p className="text-red-500">Villa kom upp við að sækja leiki. Vinsamlegast reyndu aftur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const activeGames = gamesData?.activeGames || [];
  const completedGames = gamesData?.completedGames || [];
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[700px] max-w-full bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-game-accent-blue to-game-accent-purple">
            Orðaskák
          </CardTitle>
          <p className="text-muted-foreground mt-2">Íslenskur orðaleikur í framtíðarstíl</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {showNewGame ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowNewGame(false)}
                  className="text-game-accent-blue"
                >
                  <List className="mr-2 h-4 w-4" />
                  Sýna leiki
                </Button>
                <h3 className="text-lg font-medium">Nýr leikur</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Fjöldi spilara ({playerCount})</label>
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
                <h3 className="text-sm font-medium mb-2">Nöfn spilara</h3>
                
                {/* Human player */}
                <div className="flex items-center space-x-3">
                  <UserCircle className="h-5 w-5 text-game-accent-blue" />
                  <Input
                    value={playerNames[0]}
                    readOnly
                    className="bg-game-dark/60 cursor-default"
                    placeholder="Þitt nafn"
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
                      placeholder={`Tölva ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => createGameMutation.mutate()}
                disabled={createGameMutation.isPending}
                className="w-full bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
              >
                {createGameMutation.isPending ? "Hleð..." : "Hefja leik"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Leikir þínir</h2>
                <Button 
                  onClick={() => setShowNewGame(true)} 
                  className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nýr leikur
                </Button>
              </div>
              
              {isLoading ? (
                <div className="py-8 text-center">
                  <p>Hleð leikjum...</p>
                </div>
              ) : (
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
                                    onClick={() => onStartGame(game.players.length, game.players)}
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
                                  {game.winner === playerNames[0] ? (
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
                  
                  {activeGames.length === 0 && completedGames.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="mb-4 text-muted-foreground">Þú hefur ekki spilað neina leiki ennþá.</p>
                      <Button 
                        onClick={() => setShowNewGame(true)} 
                        className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
                      >
                        Búa til fyrsta leikinn
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetup;
