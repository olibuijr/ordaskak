
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { pb, getUserById } from "@/services/pocketbase";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, UserCircle, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Update the timestamp whenever user changes or when the component mounts
  useEffect(() => {
    if (user?.id) {
      // Update the URL with a timestamp to prevent caching
      setAvatarUrl(`${pb.baseUrl}/api/files/users/${user.id}/avatar?t=${Date.now()}`);
    }
  }, [user?.id]);

  // Get detailed user stats using the new getUserById function
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
        const games = await pb.collection('games').getList(1, 20, {
          filter: `created_by = "${user.id}" || players ~ "${user.id}"`,
          sort: '-created'
        });

        let wins = 0;
        games.items.forEach(game => {
          if (game.winner === user.name || game.winner === user.username) {
            wins++;
          }
        });

        const winRatio = games.totalItems > 0 ? (wins / games.totalItems) * 100 : 0;

        return {
          games: games.items,
          winRatio: Math.round(winRatio),
          totalGames: games.totalItems,
          wins: wins
        };
      } catch (error) {
        console.error('Error fetching user stats:', error);
        return { games: [], winRatio: 0, totalGames: 0, wins: 0 };
      }
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      
      const formData = new FormData();
      formData.append('name', displayName);
      
      if (avatar) {
        formData.append('avatar', avatar);
      }
      
      return await pb.collection('users').update(user.id, formData);
    },
    onSuccess: () => {
      toast({
        title: "Uppfært!",
        description: "Notandaupplýsingar þínar hafa verið uppfærðar.",
      });
      
      if (refreshUser) {
        refreshUser();
      }
      
      if (user?.id) {
        setAvatarUrl(`${pb.baseUrl}/api/files/users/${user.id}/avatar?t=${Date.now()}`);
      }
      
      setAvatar(null);
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast({
        title: "Villa",
        description: "Ekki tókst að uppfæra notandaupplýsingar.",
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
      
      // Preview the avatar image immediately
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setAvatarUrl(fileUrl);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('is-IS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

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
          <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30 md:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl">Prófíll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24 border-2 border-game-accent-blue">
                  {avatar ? (
                    <AvatarImage src={URL.createObjectURL(avatar)} alt={user?.username} />
                  ) : (
                    <>
                      <AvatarImage 
                        src={avatarUrl} 
                        alt={user?.username} 
                      />
                      <AvatarFallback className="bg-game-dark text-game-accent-blue text-xl">
                        {user?.username?.charAt(0).toUpperCase() || <UserCircle />}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div className="space-y-2 w-full">
                  <Label htmlFor="avatar">Prófílmynd</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => document.getElementById('avatar')?.click()}
                      variant="outline" 
                      className="w-full border-game-accent-blue/50 text-game-accent-blue hover:bg-game-accent-blue/20"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Velja mynd
                    </Button>
                  </div>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                <div className="space-y-2 w-full">
                  <Label htmlFor="displayName">Nafn</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-game-dark/60"
                  />
                </div>
                
                <Button 
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending}
                  className="w-full bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
                >
                  {updateProfile.isPending ? "Hleð..." : "Vista breytingar"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Tölfræði</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <p>Hleð tölfræði...</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-game-dark/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Leikir spilaðir</p>
                      <p className="text-2xl font-bold text-game-accent-blue">{userStats?.totalGames || 0}</p>
                    </div>
                    <div className="bg-game-dark/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Sigrar</p>
                      <p className="text-2xl font-bold text-game-accent-green">{userStats?.wins || 0}</p>
                    </div>
                    <div className="bg-game-dark/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Sigurhlutfall</p>
                      <p className="text-2xl font-bold text-game-accent-purple">{userStats?.winRatio || 0}%</p>
                    </div>
                  </div>
                  
                  {userStats?.games && userStats.games.length > 0 ? (
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
                            {userStats.games.map((game: any) => (
                              <TableRow key={game.id} className="hover:bg-game-dark/50">
                                <TableCell>{formatDate(game.created)}</TableCell>
                                <TableCell>{game.playerNames?.join(', ') || game.players?.join(', ') || '-'}</TableCell>
                                <TableCell>
                                  {game.winner === user?.name || game.winner === user?.username ? (
                                    <span className="text-game-accent-green font-medium">Þú vannst!</span>
                                  ) : (
                                    <span>{game.winner || 'Óþekkt'} vann</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {game.scores && user ? game.scores[user.name || user.username] || 0 : 0}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
