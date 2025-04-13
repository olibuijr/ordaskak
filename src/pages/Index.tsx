
import { useAuth } from "@/contexts/AuthContext";
import Game from "@/components/Game";
import PromoFrontPage from "@/components/PromoFrontPage";

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F1624] text-white overflow-hidden">
      {isAuthenticated ? (
        <Game />
      ) : (
        <PromoFrontPage />
      )}
    </div>
  );
};

export default Index;
