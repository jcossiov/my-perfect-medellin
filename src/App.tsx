import { useState, useEffect } from 'react';
import {
  loadProgress,
  saveProgress,
  type Progress,
  type Avatar,
} from './utils/storage';
import { LEVELS, type ShopId } from './data/gameData';
import { type GameResult } from './game/engine';
import { MapScreen } from './components/MapScreen';
import { GameScreen } from './components/GameScreen';
import { AvatarModal } from './components/AvatarModal';
import { ShopModal } from './components/ShopModal';
import { TriviaModal } from './components/TriviaModal';
import { AlbumModal } from './components/AlbumModal';
import { WinModal } from './components/WinModal';
import { sound } from './utils/audio';

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Modales
  const [showAvatar, setShowAvatar] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  // Guardar en localStorage cada vez que progress cambia
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Actualizar avatar
  const handleSaveAvatar = (newAvatar: Avatar) => {
    setProgress((prev) => ({ ...prev, avatar: newAvatar }));
  };

  // Comprar en tienda
  const handleBuyItem = (itemId: ShopId, price: number) => {
    if (progress.coins < price) return;
    setProgress((prev) => ({
      ...prev,
      coins: prev.coins - price,
      owned: [...prev.owned, itemId],
    }));
  };

  // Responder trivia correcta
  const handleTriviaCorrect = (qId: string, reward: number) => {
    setProgress((prev) => ({
      ...prev,
      coins: prev.coins + reward,
      answered: [...prev.answered, qId],
    }));
  };

  // Fin de un nivel
  const handleGameEnd = (result: GameResult) => {
    setGameResult(result);

    if (result.win && currentLevelNumber !== null) {
      setProgress((prev) => {
        const nextUnlocked = Math.max(prev.unlocked, currentLevelNumber + 1);
        const prevStars = prev.stars[currentLevelNumber] || 0;
        const newStars = Math.max(prevStars, result.stars);
        // Si superó el nivel 8, desbloquea dragón
        const gotDragon = prev.hasDragon || currentLevelNumber === 8;

        return {
          ...prev,
          coins: prev.coins + result.coins,
          unlocked: Math.min(10, nextUnlocked),
          stars: { ...prev.stars, [currentLevelNumber]: newStars },
          hasDragon: gotDragon,
        };
      });
    } else if (!result.win) {
      // Incluso si no ganó, se le abonan las monedas recolectadas en el intento
      setProgress((prev) => ({
        ...prev,
        coins: prev.coins + result.coins,
      }));
    }
  };

  const activeLevelConfig =
    currentLevelNumber !== null ? LEVELS[currentLevelNumber - 1] : null;

  const upgrades = {
    speed: progress.owned.includes('tenis'),
    bag: progress.owned.includes('carriel'),
    gun: progress.owned.includes('pistola'),
    time: progress.owned.includes('reloj'),
    magnet: progress.owned.includes('iman'),
  };

  const toggleSound = () => {
    const nextMute = !isMuted;
    sound.setMuted(nextMute);
    setIsMuted(nextMute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-200 text-slate-800 flex flex-col justify-between selection:bg-emerald-400 selection:text-slate-900 font-sans">
      {/* Botón flotante de audio */}
      <div className="fixed top-3 right-3 z-40">
        <button
          onClick={toggleSound}
          className="w-11 h-11 rounded-2xl bg-white/90 border-2 border-white shadow-md flex items-center justify-center text-xl hover:bg-white active:scale-95 transition"
          title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 w-full">
        {currentLevelNumber === null || !activeLevelConfig ? (
          <MapScreen
            progress={progress}
            onSelectLevel={(lvl) => setCurrentLevelNumber(lvl)}
            onOpenAvatar={() => setShowAvatar(true)}
            onOpenShop={() => setShowShop(true)}
            onOpenTrivia={() => setShowTrivia(true)}
            onOpenAlbum={() => setShowAlbum(true)}
          />
        ) : (
          <GameScreen
            level={activeLevelConfig}
            avatar={progress.avatar}
            upgrades={upgrades}
            hasDragon={progress.hasDragon}
            showTutorial={!progress.tutorialSeen && currentLevelNumber === 1}
            onTutorialSeen={() =>
              setProgress((prev) => ({ ...prev, tutorialSeen: true }))
            }
            onFinish={handleGameEnd}
            onExit={() => {
              setCurrentLevelNumber(null);
              setGameResult(null);
            }}
          />
        )}
      </main>

      {/* Modales Menú */}
      {showAvatar && (
        <AvatarModal
          progress={progress}
          onSaveAvatar={handleSaveAvatar}
          onClose={() => setShowAvatar(false)}
        />
      )}

      {showShop && (
        <ShopModal
          coins={progress.coins}
          owned={progress.owned}
          onBuyItem={handleBuyItem}
          onClose={() => setShowShop(false)}
        />
      )}

      {showTrivia && (
        <TriviaModal
          answered={progress.answered}
          onCorrectAnswer={handleTriviaCorrect}
          onClose={() => setShowTrivia(false)}
        />
      )}

      {showAlbum && (
        <AlbumModal
          unlockedLevel={progress.unlocked}
          onClose={() => setShowAlbum(false)}
        />
      )}

      {/* Modal de Victoria / Derrota */}
      {gameResult && activeLevelConfig && (
        <WinModal
          result={gameResult}
          levelNumber={activeLevelConfig.number}
          levelTitle={activeLevelConfig.title}
          onNextLevel={() => {
            setGameResult(null);
            if (activeLevelConfig.number < 10) {
              setCurrentLevelNumber(activeLevelConfig.number + 1);
            } else {
              setCurrentLevelNumber(null);
            }
          }}
          onRetry={() => {
            setGameResult(null);
          }}
          onMap={() => {
            setGameResult(null);
            setCurrentLevelNumber(null);
          }}
        />
      )}

      {/* Footer Educativo */}
      <footer className="text-center py-2.5 text-xs text-sky-900 font-bold bg-white/40 backdrop-blur-sm border-t border-white/60">
        My Perfect Medellín • Conciencia ecológica, cultura paisa y reciclaje para niños 🌺
      </footer>
    </div>
  );
}
