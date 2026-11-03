import React from 'react';
import { DragonPet, PlayerEconomy } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Flame, Sparkles, Heart, Zap, Gem, X } from 'lucide-react';

interface DragonPetModalProps {
  dragon: DragonPet;
  currentLevel: number;
  economy: PlayerEconomy;
  onFeedPet: () => void;
  onHatchWithGems: () => void;
  onEvolvePet: () => void;
  onClose: () => void;
}

export const DragonPetModal: React.FC<DragonPetModalProps> = ({
  dragon,
  currentLevel,
  economy,
  onFeedPet,
  onHatchWithGems,
  onEvolvePet,
  onClose,
}) => {
  const isLevelEligible = currentLevel >= 8;

  const getDragonAvatar = () => {
    if (!dragon.hasEgg && !dragon.isHatched) return '🥚';
    if (!dragon.isHatched) return '🥚✨';
    if (dragon.stage === 'bebe') return '🐲';
    if (dragon.stage === 'juvenil') return '🐉🔥';
    return '👑🐉⚡';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-rose-500/40 w-full max-w-2xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-fun text-rose-400">Santuario del Dragón Ecológico</h2>
              <p className="text-xs text-slate-400">
                {isLevelEligible
                  ? '¡Has desbloqueado el reino de los Dragones a partir del Nivel 8!'
                  : 'Se desbloquea al alcanzar el Nivel 8 rescatando el huevo sagrado'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto py-5 space-y-6 relative z-10 pr-2">
          {!isLevelEligible && !dragon.hasEgg ? (
            /* Locked State */
            <div className="p-8 text-center bg-slate-950/60 rounded-3xl border border-slate-800 flex flex-col items-center">
              <span className="text-6xl mb-3 grayscale opacity-60">🥚🔒</span>
              <h3 className="text-base font-bold text-white mb-1">Huevo de Dragón Aún No Descubierto</h3>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                El Huevo Sagrado de Dragón se encuentra sumergido en el Nivel 8 (Arrecife de Tiburones).
                ¡Supera los niveles previos clasificando residuos y purificando Medellín para encontrarlo!
              </p>
              <div className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                Tu Nivel Actual: {currentLevel} / Requiere Nivel 8
              </div>
            </div>
          ) : !dragon.isHatched ? (
            /* Incubating Egg */
            <div className="p-6 bg-gradient-to-b from-slate-950/80 to-slate-900 rounded-3xl border border-amber-500/30 text-center flex flex-col items-center">
              <div className="text-7xl mb-4 animate-bounce">🥚✨</div>
              <h3 className="text-lg font-bold text-amber-400 mb-1">¡Tienes un Huevo de Dragón Sagrado!</h3>
              <p className="text-xs text-slate-300 max-w-md mb-4">
                El calor de tu conciencia ecológica está nutriendo el huevo. Puedes esperar a que termine de incubar o acelerarlo usando gemas ecológicas.
              </p>

              <div className="w-full max-w-xs bg-slate-800 rounded-full h-3 mb-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-400 to-rose-400 h-full transition-all duration-300"
                  style={{ width: `${Math.max(10, 100 - (dragon.incubationTimeRemaining / 120) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-amber-300 mb-5">
                Tiempo de eclosión: {Math.max(0, Math.floor(dragon.incubationTimeRemaining))}s
              </span>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => {
                    if (economy.gems >= 2) {
                      soundEngine.play7_MiMotivacion();
                      onHatchWithGems();
                    } else {
                      soundEngine.play8_MiMiedo();
                    }
                  }}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition ${
                    economy.gems >= 2
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 hover:scale-105'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Gem className="w-4 h-4 text-emerald-950" />
                  <span>Eclosionar Ya (Cuesta 2 Gemas 💎)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Hatched Dragon Pet View */
            <div className="space-y-5">
              <div className="p-6 bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/30 rounded-3xl border border-rose-500/40 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center">
                  <div className="text-7xl animate-float-bob filter drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                    {getDragonAvatar()}
                  </div>
                  <span className="text-sm font-black text-rose-300 mt-2">{dragon.name}</span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 mt-1">
                    Fase: {dragon.stage.toUpperCase()} • Nivel {dragon.level}
                  </span>
                </div>

                {/* Stats & Actions */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" /> Felicidad
                      </span>
                      <span>{dragon.happiness}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all"
                        style={{ width: `${dragon.happiness}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Poder Purificador
                      </span>
                      <span>{dragon.power} Pts</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, dragon.power)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Tu dragón te acompaña en las misiones. Pulsa <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-rose-300 font-bold">Q</kbd> para activar su aliento sagrado y quemar toxinas.
                  </p>
                </div>
              </div>

              {/* Pet Care Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    soundEngine.playRecycleSuccess();
                    onFeedPet();
                  }}
                  className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <span className="text-xl">🍓</span>
                  <span>Alimentar con Frutas Orgánicas (+Felicidad)</span>
                </button>

                <button
                  onClick={() => {
                    if (economy.gems >= 3) {
                      soundEngine.play7_MiMotivacion();
                      onEvolvePet();
                    } else {
                      soundEngine.play8_MiMiedo();
                    }
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    economy.gems >= 3
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/50 text-rose-300'
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Evolucionar Dragón (3 Gemas 💎)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
