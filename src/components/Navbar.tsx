
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LogIn, UserPlus, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/utils/avatarUtils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-game-dark/60 backdrop-blur-md border-b border-game-accent-blue/20 py-3 px-4 h-14">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-game-accent-blue to-game-accent-purple">
          Orðaskák
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1 h-10 w-10 rounded-full hover:bg-game-dark/50">
                  <Avatar className="h-8 w-8 border border-game-accent-blue/30">
                    <AvatarImage 
                      src={user?.id ? getAvatarUrl(user.id) : ''} 
                      alt={user?.username} 
                    />
                    <AvatarFallback className="bg-game-dark text-game-accent-blue">
                      {user?.username?.charAt(0).toUpperCase() || <User />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-game-light/95 backdrop-blur-md border-game-accent-blue/30">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user?.name || user?.username}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Prófíll</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-red-500 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Útskrá</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="border-game-accent-blue text-game-accent-blue hover:bg-game-accent-blue/20 flex gap-2"
              >
                <Link to="/login">
                  <LogIn size={16} />
                  <span className="hidden md:inline-block">Innskrá</span>
                </Link>
              </Button>
              <Button 
                size="sm"
                asChild
                className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black flex gap-2"
              >
                <Link to="/register">
                  <UserPlus size={16} />
                  <span className="hidden md:inline-block">Nýskrá</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
