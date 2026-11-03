import React, { useEffect } from 'react';
import { PlayerAvatar } from '../types/game';
import { soundEngine } from '../utils/audio';
import { RotateCcw, AlertOctagon } from 'lucide-react';

interface BlackHoleDefeatProps {
  avatar: PlayerAvatar;
  levelNumber: number;
  reason: string;
  onRestartLevel: () => void;
}

export const BlackHoleDefeat: React.FC<BlackHoleDefeatProps> = ({
  avatar,
  levelNumber,
  reason,
  onRestartLevel,
}) => {
  useEffect(() => {
    soundEngine.playBlackHoleDefeat();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="bg-slate-900 border-2 border-rose-500/80 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center relative overflow-hidden">
        {/* Swirling Trash Black Hole Centerpiece */}
        <div className="relative w-56 h-56 flex items-center justify-center my-4">
          {/* Swirling dark vortex circles */}
          <div className="absolute inset-0 rounded-full border-4 border-dashed border-rose-600/40 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="absolute inset-4 rounded-full border-4 border-dashed border-purple-600/50 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
          <div className="absolute inset-8 rounded-full bg-slate-950 shadow-[inset_0_0_40px_rgba(225,29,72,0.8)] border border-rose-500/50 flex items-center justify-center overflow-hidden">
            {/* Swirling trash particles */}
            <span className="absolute text-xl animate-spin text-lime-400" style={{ animationDuration: '2.5s', top: '20%', left: '20%' }}>🍌</span>
            <span className="absolute text-xl animate-spin text-rose-400" style={{ animationDuration: '1.8s', bottom: '25%', right: '20%' }}>🥤</span>
            <span className="absolute text-xl animate-spin text-amber-400" style={{ animationDuration: '3s', top: '60%', left: '30%' }}>🐟</span>
            <span className="absolute text-2xl animate-spin text-purple-400" style={{ animationDuration: '2.2s', bottom: '15%', left: '45%' }}>☣️</span>
          </div>

          {/* Player avatar getting sucked down into vortex */}
          <div className="animate-vortex z-10 flex flex-col items-center pointer-events-none">
            <span className="text-4xl">{avatar.gender === 'chico' ? '😱' : '😨'}</span>
            <span className="text-xs font-bold text-rose-300 mt-1">¡Auxilio!</span>
          </div>
        </div>

        {/* Failure message */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 text-xs font-black uppercase tracking-wider mb-2">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>¡SUCCIONADO POR EL HOYO NEGRO DE BASURA!</span>
        </div>

        <h3 className="text-xl font-black font-fun text-white mb-2">
          El Basurote y la Contaminación Ganaron Terreno
        </h3>

        <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
          {reason || 'El tiempo se agotó o la acumulación de desechos abrió un vórtice de smog en el sector.'}
        </p>

        {/* Motivational paisa tip */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-xs text-amber-300/90 italic mb-5 flex items-center gap-2 text-left">
          <span className="text-2xl">👴☕</span>
          <div>
            <span className="font-bold block text-white not-italic">Don Mateo te da ánimo:</span>
            "¡Ánimo, mi muchacho! Los paisas no nos rendimos jamás. Sacúdete el polvo y limpiemos esto de nuevo."
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={() => {
            soundEngine.play7_MiMotivacion();
            onRestartLevel();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Volver al Inicio del Nivel {levelNumber}</span>
        </button>
      </div>
    </div>
  );
};
