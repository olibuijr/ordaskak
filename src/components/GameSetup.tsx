import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserCircle, List, Check, Play, Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pb, fetchUserGames, createNewGame, searchUsers } from '@/services/pocketbase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GameSetupProps {
  onStartGame: (playerCount: number, playerNames: string[], newGameId?: string) => void;
}

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

interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string | null;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const { user } = useAuth();
  const [showNewGame, setShowNewGame] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();
  
  const fetchGames = async () => {
    if (!user) return { activeGames: [], completedGames: [] };
    
    try {
      return await fetchUserGames(user.id);
    } catch (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
  };
  
  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      const filteredResults = results.filter(
        result => !selectedUsers.some(u => u.id === result.id) && result.id !== user?.id
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Villa við leit",
        description: "Ekki tókst að leita að notendum.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectUser = (userData: UserData) => {
    setSelectedUsers([...selectedUsers, userData]);
    setSearchResults([]);
    setSearchQuery('');
  };
  
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };
  
  const createGame = async () => {
    if (!user) return null;
    
    try {
      const playerNames = [
        user.name || user.username || 'Þú',
        ...selectedUsers.map(u => u.name || u.username)
      ];
      
      console.log("Creating game with players:", playerNames);
      
      const data = {
        name: `Leikur ${new Date().toLocaleString('is-IS')}`,
        playerNames: playerNames,
        selectedUsers: selectedUsers,
        isActive: true,
        userId: user.id
      };
      
      const newGame = await createNewGame(data);
      return newGame;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  };
  
  const { data: gamesData, isLoading, error } = useQuery({
    queryKey: ['games', user?.id],
    queryFn: fetchGames,
    enabled: !!user,
    retry: 1
  });
  
  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setShowNewGame(false);
      if (data) {
        const playerNames = [
          user?.name || user?.username || 'Þú',
          ...selectedUsers.map(u => u.name || u.username)
        ];
        onStartGame(
          playerNames.length,
          playerNames,
          data.id
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
  
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 300);
      
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);
  
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
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[700px] max-w-full bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-red-500">Villa kom upp við að sækja leiki.</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['games'] })}
                className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
              >
                Reyna aftur
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewGame(true)}
                className="ml-2 border-game-accent-blue/50 text-game-accent-blue hover:bg-game-accent-blue/20"
              >
                Nýr leikur
              </Button>
            </div>
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
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium mb-2">Spilarar</h3>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-game-accent-blue/30">
                    <AvatarImage 
                      src={user?.id ? `${pb.baseUrl}/api/files/users/${user.id}/avatar` : ''} 
                      alt={user?.username} 
                    />
                    <AvatarFallback className="bg-game-dark text-game-accent-blue">
                      {user?.username?.charAt(0).toUpperCase() || <UserCircle />}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    value={user?.name || user?.username || 'Notandi'}
                    readOnly
                    className="bg-game-dark/60 cursor-default"
                    placeholder="Þitt nafn"
                  />
                </div>
                
                <div className="space-y-4 mt-4">
                  <div className="relative">
                    <div className="flex space-x-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-game-dark/60"
                        placeholder="Leita að öðrum spilurum"
                      />
                      <Button 
                        onClick={handleSearch}
                        className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
                        disabled={isSearching || searchQuery.length < 2}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="absolute mt-1 w-full z-10 bg-game-dark rounded-md shadow-lg max-h-60 overflow-auto">
                        <ScrollArea className="p-1">
                          {searchResults.map((result) => (
                            <div 
                              key={result.id}
                              className="p-2 hover:bg-game-accent-blue/20 cursor-pointer rounded-sm flex items-center space-x-3"
                              onClick={() => handleSelectUser(result)}
                            >
                              <Avatar className="h-8 w-8 border border-game-accent-blue/30">
                                <AvatarImage 
                                  src={result.avatar || undefined} 
                                  alt={result.username} 
                                />
                                <AvatarFallback className="bg-game-dark text-game-accent-purple">
                                  {result.username?.charAt(0).toUpperCase() || <UserCircle />}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{result.name || result.username}</p>
                                <p className="text-sm text-muted-foreground truncate">{result.email}</p>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                  
                  {selectedUsers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Valdir spilarar</h4>
                      {selectedUsers.map((selectedUser) => (
                        <div key={selectedUser.id} className="flex justify-between items-center p-2 bg-game-dark/30 rounded-md">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8 border border-game-accent-blue/30">
                              <AvatarImage 
                                src={selectedUser.avatar || undefined} 
                                alt={selectedUser.username} 
                              />
                              <AvatarFallback className="bg-game-dark text-game-accent-purple">
                                {selectedUser.username?.charAt(0).toUpperCase() || <UserCircle />}
                              </AvatarFallback>
                            </Avatar>
                            <span>{selectedUser.name || selectedUser.username}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveUser(selectedUser.id)}
                            className="text-red-400 hover:text-red-500 hover:bg-transparent"
                          >
                            Fjarlægja
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                                  {game.winner === user?.name || game.winner === user?.username ? (
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
