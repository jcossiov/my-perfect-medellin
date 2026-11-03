import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerAvatar } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Flame, Sparkles, Trophy, Music, ArrowRight, Zap } from 'lucide-react';

interface ViralDanceCelebrationProps {
  levelNumber: number;
  avatar: PlayerAvatar;
  scoreGained: number;
  streak: number;
  onNextLevel: () => void;
}

export const ViralDanceCelebration: React.FC<ViralDanceCelebrationProps> = ({
  levelNumber,
  avatar,
  scoreGained,
  streak,
  onNextLevel,
}) => {
  const [danceMove, setDanceMove] = useState<'floss' | 'cumbia' | 'salto'>('floss');

  useEffect(() => {
    // Launch festive confetti fireworks
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'],
    });

    soundEngine.playViralDanceBeat();

    const interval = setInterval(() => {
      setDanceMove(prev => (prev === 'floss' ? 'cumbia' : prev === 'cumbia' ? 'salto' : 'floss'));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const hasSuperpowerReward = streak >= 3 || scoreGained >= 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg">
      <div className="bg-slate-900 border-2 border-amber-400 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-emerald-500/10 to-transparent pointer-events-none" />

        {/* Top Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>¡NIVEL {levelNumber} COMPLETADO!</span>
        </div>

        <h2 className="text-2xl font-black font-fun text-white mb-1">
          ¡Festejo con Baile Viral Paisa!
        </h2>
        <p className="text-xs text-slate-300 max-w-xs mb-4">
          ¡Medellín está más limpia y reluciente gracias a ti! Todo el barrio celebra tu logro.
        </p>

        {/* Viral Dancing Avatar Animation */}
        <div className="relative my-4 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-amber-400/20 to-emerald-400/30 flex items-center justify-center border-2 border-amber-400/40 animate-pulse">
            <div className="animate-viral-dance flex flex-col items-center">
              {/* Accessory */}
              {avatar.accessory === 'sombrero_vueltiao' && (
                <div className="text-3xl -mb-2">🤠</div>
              )}
              {/* Head */}
              <div
                className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center relative shadow-lg"
                style={{ backgroundColor: avatar.skinTone }}
              >
                <div
                  className="absolute -top-1 w-12 h-5 rounded-t-full"
                  style={{ backgroundColor: avatar.hairColor }}
                />
                <span className="text-2xl mt-2">{avatar.gender === 'chico' ? '😎' : '🤩'}</span>
              </div>
              {/* Body */}
              <div
                className="w-16 h-14 rounded-xl -mt-1 flex items-center justify-center text-white text-xs font-black shadow-md"
                style={{ backgroundColor: avatar.auraColor }}
              >
                💃🕺
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
            <Music className="w-4 h-4 animate-bounce" />
            <span>Paso Actual: {danceMove === 'floss' ? 'El Floss Paisa' : danceMove === 'cumbia' ? 'Cumbia Urbana' : 'Salto del Metrocable'}</span>
          </div>
        </div>

        {/* Win Streak & Powers Box */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 my-2 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Racha de Bailes Victoriosos:</span>
            </span>
            <span className="font-black text-amber-400 text-sm">
              {streak} / 3 Victorias
            </span>
          </div>

          {/* Progress bar to 3 streak */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all"
              style={{ width: `${Math.min(100, (streak / 3) * 100)}%` }}
            />
          </div>

          {hasSuperpowerReward ? (
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>¡Racha de 3 alcanzada! +500 Puntos y Superpoder Purificador Activado</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              * Gana 3 niveles seguidos para desbloquear el Superpoder Purificador y 500 puntos extra.
            </p>
          )}
        </div>

        {/* Next Level Action Button */}
        <div className="mt-3 w-full flex items-center justify-between gap-3">
          <button
            onClick={() => {
              soundEngine.playViralDanceBeat();
              confetti({ particleCount: 50, spread: 60 });
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Repetir Baile</span>
          </button>

          <button
            onClick={() => {
              soundEngine.play7_MiMotivacion();
              onNextLevel();
            }}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
          >
            <span>Siguiente Nivel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
