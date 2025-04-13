
import React, { useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import GameSetup from './GameSetup';
import GameLoading from './game/GameLoading';
import GameError from './game/GameError';
import GameLayout from './game/GameLayout';
import { useLocation } from 'react-router-dom';

const Game: React.FC = () => {
  const location = useLocation();
  
  // Extract game ID from URL
  const getGameIdFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const pathGameId = location.pathname.split('/').pop();
    return pathGameId && pathGameId !== 'game' ? pathGameId : id;
  };

  const {
    gameState,
    selectedTile,
    wordHistory,
    isLoading,
    isInitialLoad,
    updateQueued,
    setGameId,
    fetchExistingGame,
    handleStartGame,
    handleTileClick,
    handleCellClick,
    handlePlayWord,
    handleShuffleTiles,
    handlePassTurn,
    handleRecallTiles
  } = useGameState(null);

  // Load game data when location changes
  useEffect(() => {
    const gameId = getGameIdFromUrl();
    if (gameId) {
      setGameId(gameId);
      fetchExistingGame(gameId);
    }
  }, [location]);

  // Loading state
  if (isLoading || isInitialLoad) {
    return <GameLoading />;
  }

  // No game state - show game setup
  if (!gameState) {
    return <GameSetup onStartGame={handleStartGame} />;
  }

  // Invalid game state - no players
  if (!gameState.players || gameState.players.length === 0) {
    return (
      <GameError
        title="Villa: Engir leikmenn í boði"
        message="Það virðist sem leikurinn hafi ekki verið settur upp rétt."
        onReset={() => setGameId(null)}
      />
    );
  }

  // Make sure current player is valid
  const currentPlayerIndex = gameState.currentPlayerIndex >= 0 && 
                             gameState.currentPlayerIndex < gameState.players.length ? 
                             gameState.currentPlayerIndex : 0;
  
  const currentPlayer = gameState.players[currentPlayerIndex];
  
  // Invalid current player
  if (!currentPlayer) {
    return (
      <GameError
        title="Villa: Leikmaður finnst ekki"
        message="Það virðist sem gögn um núverandi leikmann séu ógild."
        onReset={() => setGameId(null)}
      />
    );
  }
  
  // Render the game
  return (
    <GameLayout
      gameState={gameState}
      selectedTileId={selectedTile?.id || null}
      wordHistory={wordHistory}
      updateQueued={updateQueued}
      onTileClick={handleTileClick}
      onCellClick={handleCellClick}
      onPlayWord={handlePlayWord}
      onShuffleTiles={handleShuffleTiles}
      onPassTurn={handlePassTurn}
      onRecallTiles={handleRecallTiles}
    />
  );
};

export default Game;
