
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserGames, createNewGame } from '@/services/games';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import GamesList from './game-setup/GamesList';
import NewGameForm from './game-setup/NewGameForm';

interface GameSetupProps {
  onStartGame: (playerCount: number, playerNames: string[], newGameId?: string) => void;
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
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
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
  
  const handleSelectUser = (userData: UserData) => {
    setSelectedUsers([...selectedUsers, userData]);
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
      setSelectedUsers([]);
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
            <NewGameForm 
              onBackToList={() => setShowNewGame(false)}
              onCreateGame={() => createGameMutation.mutate()}
              isCreating={createGameMutation.isPending}
              user={user}
              onSelectUser={handleSelectUser}
              onRemoveUser={handleRemoveUser}
              selectedUsers={selectedUsers}
            />
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
                  {activeGames.length > 0 || completedGames.length > 0 ? (
                    <GamesList 
                      activeGames={activeGames}
                      completedGames={completedGames}
                      onStartGame={onStartGame}
                      currentUserName={user?.name || user?.username}
                      formatDate={formatDate}
                    />
                  ) : (
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
