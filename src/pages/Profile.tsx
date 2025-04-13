
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/services/users";
import { pb } from "@/services/pocketbase";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfileStats from "@/components/profile/ProfileStats";

// Define an interface for Game to fix the type error
interface Game {
  id: string;
  created: string;
  playerNames?: string[];
  status?: string;
  winner?: string;
  players?: string[];
  created_by?: string;
  name?: string;
}

const Profile = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();

  // Get detailed user stats using the getUserById function
  const { data: userDetails, isLoading: userLoading } = useQuery({
    queryKey: ["userDetails", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getUserById(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["userStats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { games: [], winRatio: 0, totalGames: 0, wins: 0 };
      
      try {
        // Fix the filter parameter - using created_by instead of userId and removing isActive filter
        const gamesResult = await pb.collection('games').getList(1, 20, {
          filter: `created_by = "${user.id}" || players ~ "${user.id}"`,
          sort: '-created'
        });

        // Convert RecordModel[] to Game[]
        const games: Game[] = gamesResult.items.map(game => ({
          id: game.id,
          created: game.created,
          playerNames: game.playerNames,
          status: game.status,
          winner: game.winner,
          players: game.players,
          created_by: game.created_by,
          name: game.name
        }));

        let wins = 0;
        games.forEach(game => {
          if (game.winner === user.name || game.winner === user.username) {
            wins++;
          }
        });

        const winRatio = games.length > 0 ? (wins / games.length) * 100 : 0;

        return {
          games,
          winRatio: Math.round(winRatio),
          totalGames: gamesResult.totalItems,
          wins: wins
        };
      } catch (error) {
        console.error('Error fetching user stats:', error);
        return { games: [], winRatio: 0, totalGames: 0, wins: 0 };
      }
    },
    enabled: !!user?.id,
  });

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-[400px] max-w-full">
          <CardContent className="p-6 text-center">
            <p>Þú þarft að vera innskráð(ur) til að skoða þessa síðu.</p>
            <Button className="mt-4" asChild>
              <Link to="/login">Innskrá</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the user details from the API if available, otherwise fall back to context user
  const displayUser = userDetails || user;

  return (
    <div className="h-[calc(100vh-56px)] bg-[#0F1624] text-white overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" asChild className="p-2">
            <Link to="/"><ArrowLeft size={20} /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Notandaprófíll</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {user && (
            <ProfileForm 
              userId={user.id}
              username={user.username}
              name={user.name}
              refreshUser={refreshUser}
            />
          )}
          
          <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Tölfræði</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileStats 
                totalGames={userStats?.totalGames || 0}
                wins={userStats?.wins || 0}
                winRatio={userStats?.winRatio || 0}
                games={userStats?.games || []}
                isLoading={statsLoading}
                username={user?.username}
                name={user?.name}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
