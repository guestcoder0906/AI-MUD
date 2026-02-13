import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameEngine } from './hooks/useGameEngine';
import { useMultiplayer } from './hooks/useMultiplayer';
import { Terminal } from './components/Terminal';
import { FileSystem } from './components/FileSystem';
import { AuthModal } from './components/AuthModal';
import { GameModeSelector } from './components/GameModeSelector';
import { JoinGameModal } from './components/JoinGameModal';
import { MultiplayerUI } from './components/MultiplayerUI';
import { GameMode } from './types';
import { DebugAuth } from './DebugAuth';

// Add debug mode by appending ?debug to URL
const isDebugMode = new URLSearchParams(window.location.search).has('debug');

const App: React.FC = () => {
  // Show debug page if ?debug is in URL
  if (isDebugMode) {
    return <DebugAuth />;
  }
  const {
    user,
    isAuthenticated,
    needsUsername,
    signIn,
    signOut,
    setUsername,
    skipUsername,
  } = useAuth();

  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const {
    currentGame,
    players,
    isHost,
    createGame,
    joinGame,
    leaveGame,
    deleteGame,
    kickPlayer,
    forceNextTurn,
    markTurnSubmitted,
  } = useMultiplayer(user);

  const {
    gameState,
    handleInput,
    resetGame,
    toggleDebug,
    inspectItem,
    selectedFile,
    setSelectedFile,
    isPlayerDead
  } = useGameEngine({
    gameMode: gameMode || 'single',
    multiplayerUserId: user?.id,
    multiplayerUsername: user?.username,
    onTurnComplete: async () => {
      if (gameMode === 'multiplayer') {
        await markTurnSubmitted(true);
      }
    },
  });

  const [inputValue, setInputValue] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Watch for currentGame changes to ensure gameMode stays in sync
  useEffect(() => {
    if (currentGame && gameMode !== 'multiplayer') {
      console.log('Current game detected, setting mode to multiplayer');
      setGameMode('multiplayer');
    } else if (!currentGame && gameMode === 'multiplayer') {
      console.log('No current game, resetting mode');
      setGameMode(null);
    }
  }, [currentGame]);

  // Check for API Key presence
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkApiKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // Auto-focus input on load and after AI response
  useEffect(() => {
    if (!gameState.isLoading) {
      inputRef.current?.focus();
    }
  }, [gameState.isLoading]);

  // Auto-show sidebar in debug mode
  useEffect(() => {
    if (gameState.debugMode) setShowSidebar(true);
  }, [gameState.debugMode]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleInput(inputValue);
    setInputValue('');
  };

  const formatTime = (time: number) => {
    if (time === 0) return "TIME NOT SET";
    try {
      return new Date(time).toLocaleDateString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "INVALID TIME";
    }
  };

  // Handle game mode selection
  const handleSelectMode = async (mode: GameMode | 'join') => {
    if (mode === 'single') {
      setGameMode('single');
    } else if (mode === 'multiplayer') {
      // Host game
      const result = await createGame();
      if (result.success) {
        setGameMode('multiplayer');
        // Force update to ensure UI shows multiplayer
        setTimeout(() => setGameMode('multiplayer'), 100);
      } else {
        alert(result.error || 'Failed to create game');
      }
    } else if (mode === 'join') {
      setShowJoinModal(true);
    }
  };

  // Handle joining game
  const handleJoinGame = async (code: string) => {
    const result = await joinGame(code);
    if (result.success) {
      setGameMode('multiplayer');
      setShowJoinModal(false);
      // Force update to ensure UI reflects join
      setTimeout(() => setGameMode('multiplayer'), 100);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  // Handle leaving game - reload page after leaving
  const handleLeaveGame = async () => {
    await leaveGame();
    // Reload page to reset state
    window.location.reload();
  };

  // Handle deleting game (host only) - reload page after
  const handleDeleteGame = async () => {
    await deleteGame();
    // Reload page to reset state
    window.location.reload();
  };

  // Check if waiting for other players
  const activePlayers = players.filter(p => p.is_active && !p.is_dead).length;
  const waitingForPlayers = gameMode === 'multiplayer' && activePlayers < players.length;

  // Show username modal if needed
  if (needsUsername) {
    return <AuthModal isOpen={true} onSetUsername={setUsername} onSkip={skipUsername} />;
  }

  // Show game mode selector if no game mode selected
  if (!gameMode) {
    return (
      <div className="h-screen w-screen bg-terminal-black text-terminal-green font-mono flex flex-col overflow-hidden">
        <GameModeSelector
          onSelectMode={handleSelectMode}
          isAuthenticated={isAuthenticated}
          onSignIn={signIn}
          onSignOut={signOut}
          user={user}
        />
        <JoinGameModal
          isOpen={showJoinModal}
          onJoin={handleJoinGame}
          onCancel={() => setShowJoinModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-terminal-black text-terminal-green font-mono flex flex-col overflow-hidden relative selection:bg-terminal-green selection:text-terminal-black">

      {/* Header / Status Bar */}
      <header className="h-12 border-b border-terminal-gray bg-terminal-black flex items-center justify-between px-4 z-20 shadow-md shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-terminal-amber font-bold tracking-widest">AI-MUD</div>
          <div className="hidden md:block text-xs text-terminal-lightGray opacity-50">
            {gameMode === 'multiplayer' ? 'MULTIPLAYER' : 'SINGLE PLAYER'}
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6 text-sm">
          {!hasApiKey && window.aistudio && (
            <button
              onClick={handleConnectKey}
              className="text-xs bg-terminal-amber text-terminal-black px-3 py-1 rounded font-bold hover:bg-yellow-400 transition-colors animate-pulse"
            >
              CONNECT KEY
            </button>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-terminal-lightGray text-xs uppercase hidden sm:inline">World Time</span>
            <span className="text-terminal-green font-bold">{formatTime(gameState.worldTime)}</span>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`text-xs uppercase border px-2 py-1 rounded transition-colors ${showSidebar ? 'bg-terminal-green/10 border-terminal-green text-terminal-green' : 'border-terminal-gray text-terminal-lightGray'}`}
          >
            {showSidebar ? 'Hide' : 'Files'}
          </button>

          <div className="flex items-center space-x-2 border-l border-terminal-gray pl-4">
            <span className="text-terminal-lightGray text-xs uppercase hidden md:inline">Debug</span>
            <button
              onClick={toggleDebug}
              className={`w-8 h-4 rounded-full relative transition-colors duration-200 ease-in-out border ${gameState.debugMode ? 'bg-terminal-dimAmber border-terminal-amber' : 'bg-terminal-black border-terminal-gray'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-current transition-transform duration-200 ${gameState.debugMode ? 'translate-x-4 text-terminal-amber' : 'text-terminal-gray'}`}></div>
            </button>
          </div>

          <button
            onClick={gameMode === 'multiplayer' ? handleLeaveGame : resetGame}
            className="text-red-900 hover:text-red-500 text-xs uppercase border border-red-900 px-2 py-1 rounded transition-colors"
          >
            {gameMode === 'multiplayer' ? 'Leave' : 'Reset'}
          </button>
        </div>
      </header>

      {/* Multiplayer UI */}
      {gameMode === 'multiplayer' && currentGame && (
        <MultiplayerUI
          gameCode={currentGame.code}
          players={players}
          isHost={isHost}
          onKickPlayer={kickPlayer}
          onForceNextTurn={forceNextTurn}
          onDeleteGame={handleDeleteGame}
          onLeaveGame={handleLeaveGame}
          waitingForPlayers={waitingForPlayers}
          activePlayers={activePlayers}
          totalPlayers={players.length}
        />
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Main Terminal Area */}
        <main className="flex-1 flex flex-col relative bg-gradient-to-b from-terminal-black to-[#050505]">

          <Terminal
            history={gameState.history}
            isLoading={gameState.isLoading}
            onReferenceClick={inspectItem}
            userId={user?.username}
          />

          {/* Input Area */}
          <div className="relative bg-terminal-black border-t border-terminal-gray shrink-0">
            <div className="p-4">
              <form onSubmit={onSubmit} className="relative flex items-center">
                <span className="absolute left-3 text-terminal-amber font-bold animate-pulse">{'>'}</span>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    isPlayerDead ? "PLAYER IS DECEASED - ACCESS DENIED" :
                      !hasApiKey ? "Connect API Key to Start..." :
                        waitingForPlayers ? "Waiting for other players..." :
                          (gameState.isInitialized ? "Enter command..." : "Initialize reality (e.g., 'A hard sci-fi space station running on low power')")
                  }
                  className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-3 pl-8 text-terminal-green focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green placeholder-terminal-gray/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={gameState.isLoading || !hasApiKey || isPlayerDead || waitingForPlayers}
                  autoComplete="off"
                />
              </form>
            </div>
          </div>
        </main>

        {/* File System Sidebar */}
        {showSidebar && (
          <aside className="absolute md:relative right-0 top-0 bottom-0 z-30 w-full md:w-80 h-full border-l border-terminal-gray shadow-xl animate-fade-in bg-terminal-black">
            <div className="h-full w-full relative">
              {/* Close button for mobile */}
              <button
                onClick={() => setShowSidebar(false)}
                className="absolute top-2 right-2 md:hidden text-terminal-lightGray z-40"
              >✕</button>

              <FileSystem
                files={gameState.files}
                externalSelectedFile={selectedFile}
                onSelect={setSelectedFile}
                debugMode={gameState.debugMode}
                liveUpdates={gameState.liveUpdates}
                userId={user?.username}
              />
            </div>
          </aside>
        )}

      </div>
    </div>
  );
};

export default App;