
import React from 'react';

interface GameLoadingProps {
  message?: string;
}

const GameLoading: React.FC<GameLoadingProps> = ({ 
  message = 'Hleð leik...' 
}) => {
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col gap-6 min-h-screen items-center justify-center">
      <div className="text-center p-8 bg-game-dark rounded-lg">
        <h2 className="text-2xl font-bold mb-3 text-game-accent-blue">
          {message}
        </h2>
        <p>Vinsamlegast bíddu á meðan leikurinn er sóttur.</p>
      </div>
    </div>
  );
};

export default GameLoading;
