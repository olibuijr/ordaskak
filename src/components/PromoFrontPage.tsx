import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Award, 
  BookOpen, 
  Brain, 
  Globe, 
  Rocket,
  Users 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const PromoFrontPage = () => {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 space-y-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-6 pt-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-game-accent-blue to-game-accent-purple">
            Orðaskák
          </h1>
          <p className="text-lg md:text-xl max-w-2xl text-gray-300">
            Þverfaglegur og spennandi orðaleikur fyrir alla fjölskylduna. Byggður á íslensku tungumáli.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              size="lg"
              asChild
              className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
            >
              <Link to="/register">Nýskrá</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-game-accent-pink text-game-accent-pink hover:bg-game-accent-pink/20"
            >
              <Link to="/login">Innskrá</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Af hverju Orðaskák?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="h-10 w-10 text-game-accent-blue" />}
              title="Þjálfar Íslenskukunnáttu"
              description="Bættu orðaforða þinn á skemmtilegan og óvenjulegan hátt með orðaleik sem ögrar þér."
            />
            
            <FeatureCard
              icon={<Users className="h-10 w-10 text-game-accent-purple" />}
              title="Spila með Vinum"
              description="Keppaðu við vini þína eða fjölskyldu í skemmtilegum fjölspilaraleik."
            />
            
            <FeatureCard
              icon={<Globe className="h-10 w-10 text-game-accent-pink" />}
              title="Íslenskt Viðmót"
              description="Sérhannað viðmót á íslensku sem styður við og eflir íslenska tungumálið."
            />
          </div>
        </div>

        {/* How to Play */}
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Hvernig á að spila
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <HowToPlayCard
              number="1"
              title="Búðu til aðgang"
              description="Nýskráðu þig til að geta spilað og safnað stigum."
            />
            
            <HowToPlayCard
              number="2"
              title="Stofnaðu leik"
              description="Stofnaðu nýjan leik og bjóddu vinum þínum að taka þátt."
            />
            
            <HowToPlayCard
              number="3"
              title="Spilaðu orð"
              description="Notaðu stafina þína til að mynda orð á leikborðinu."
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center py-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            Tilbúin(n) að byrja?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl">
            Stofnaðu aðgang núna og byrjaðu að spila Orðaskák með vinum þínum.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black mt-4"
          >
            <Link to="/register">Nýskrá núna</Link>
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => {
  return (
    <div className="bg-game-dark/60 backdrop-blur-md border border-game-accent-blue/20 rounded-lg p-6 transition-all hover:border-game-accent-blue/40 hover:shadow-md hover:shadow-game-accent-blue/10">
      <div className="flex flex-col items-center text-center space-y-4">
        {icon}
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
};

const HowToPlayCard = ({ number, title, description }: {
  number: string;
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-game-dark/60 backdrop-blur-md border border-game-accent-purple/20 rounded-lg p-6 transition-all hover:border-game-accent-purple/40">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-game-accent-purple/20 text-game-accent-purple font-bold">
            {number}
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <p className="text-gray-400 pl-11">{description}</p>
      </div>
    </div>
  );
};

export default PromoFrontPage;
