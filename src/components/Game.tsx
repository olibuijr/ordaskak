
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
    console.log("Game component mounted, extracted game ID:", gameId);
    if (gameId) {
      setGameId(gameId);
      fetchExistingGame(gameId);
    } else {
      console.log("No game ID found in URL, showing game setup");
    }
  }, [location]);

  // Show detailed loading state for debugging
  if (isLoading || isInitialLoad) {
    console.log("Game is in loading state:", { isLoading, isInitialLoad });
    return <GameLoading message={`Hleð leik... ${getGameIdFromUrl() || ''}`} />;
  }

  // No game state - show game setup
  if (!gameState) {
    console.log("No game state available, showing game setup");
    return <GameSetup onStartGame={handleStartGame} />;
  }

  // Invalid game state - no players
  if (!gameState.players || gameState.players.length === 0) {
    console.log("Invalid game state: No players found");
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
    console.log("Invalid game state: Current player not found");
    return (
      <GameError
        title="Villa: Leikmaður finnst ekki"
        message="Það virðist sem gögn um núverandi leikmann séu ógild."
        onReset={() => setGameId(null)}
      />
    );
  }
  
  console.log("Game loaded successfully, showing game layout");
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
