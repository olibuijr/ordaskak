
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserCircle, Upload } from "lucide-react";
import { getAvatarUrl, getFilePreviewUrl } from "@/utils/avatarUtils";

interface ProfileAvatarProps {
  userId?: string;
  username?: string;
  onAvatarChange: (file: File) => void;
  avatarFile: File | null;
}

const ProfileAvatar = ({ userId, username, onAvatarChange, avatarFile }: ProfileAvatarProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAvatarChange(file);
      setPreviewUrl(getFilePreviewUrl(file));
    }
  };

  // Determine the avatar source
  let avatarSrc = '';
  if (previewUrl) {
    avatarSrc = previewUrl;
  } else if (avatarFile) {
    avatarSrc = getFilePreviewUrl(avatarFile);
  } else if (userId) {
    avatarSrc = getAvatarUrl(userId);
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="w-24 h-24 border-2 border-game-accent-blue">
        <AvatarImage 
          src={avatarSrc} 
          alt={username || "User avatar"} 
        />
        <AvatarFallback className="bg-game-dark text-game-accent-blue text-xl">
          {username?.charAt(0).toUpperCase() || <UserCircle />}
        </AvatarFallback>
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
    </div>
  );
};

export default ProfileAvatar;
