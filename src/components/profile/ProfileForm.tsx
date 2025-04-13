
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/services/pocketbase";
import ProfileAvatar from "./ProfileAvatar";

interface ProfileFormProps {
  userId: string;
  username?: string;
  name?: string;
  refreshUser: () => void;
}

const ProfileForm = ({ userId, username, name, refreshUser }: ProfileFormProps) => {
  const [displayName, setDisplayName] = useState(name || "");
  const [avatar, setAvatar] = useState<File | null>(null);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('name', displayName);
      
      if (avatar) {
        formData.append('avatar', avatar);
      }
      
      return await pb.collection('users').update(userId, formData);
    },
    onSuccess: () => {
      toast({
        title: "Uppfært!",
        description: "Notandaupplýsingar þínar hafa verið uppfærðar.",
      });
      
      if (refreshUser) {
        refreshUser();
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

  return (
    <Card className="bg-game-light/40 backdrop-blur-md border-game-accent-blue/30 md:col-span-1">
      <CardHeader>
        <CardTitle className="text-xl">Prófíll</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <ProfileAvatar 
            userId={userId}
            username={username}
            onAvatarChange={setAvatar}
            avatarFile={avatar}
          />
          
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
  );
};

export default ProfileForm;
