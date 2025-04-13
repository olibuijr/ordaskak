
import React from 'react';

interface GameErrorProps {
  title: string;
  message: string;
  onReset: () => void;
}

const GameError: React.FC<GameErrorProps> = ({ 
  title, 
  message, 
  onReset 
}) => {
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col gap-6 min-h-screen">
      <div className="text-center p-8 bg-game-dark rounded-lg">
        <h2 className="text-2xl font-bold mb-3 text-game-accent-blue">
          {title}
        </h2>
        <p className="mb-4">{message}</p>
        <button 
          onClick={onReset} 
          className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black px-4 py-2 rounded"
        >
          Fara til baka
        </button>
      </div>
    </div>
  );
};

export default GameError;
