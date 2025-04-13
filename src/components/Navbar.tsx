
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-game-dark/60 backdrop-blur-md border-b border-game-accent-blue/20 py-3 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-game-accent-blue to-game-accent-purple">
          Orðaskák
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-white hidden md:inline-block">
                Velkomin(n), {user?.username}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="border-game-accent-pink text-game-accent-pink hover:bg-game-accent-pink/20 flex gap-2"
              >
                <LogOut size={16} />
                <span className="hidden md:inline-block">Útskrá</span>
              </Button>
            </>
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
