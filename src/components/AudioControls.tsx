import React, { useState } from 'react';
import { Volume2, VolumeX, Music, ChevronDown, ChevronUp } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export const AudioControls: React.FC = () => {
  const [muted, setMuted] = useState(soundEngine.getMuted());
  const [showSoundboard, setShowSoundboard] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
    if (!next) {
      soundEngine.play1_DoAmbientacion();
    }
  };

  const soundboardItems = [
    { id: 1, label: '1. DO Ambientación', action: () => soundEngine.play1_DoAmbientacion(), desc: 'Acorde Do mayor suave y envolvente' },
    { id: 2, label: '2. DO Grave leve', action: () => soundEngine.play2_DoGraveLeve(), desc: 'Bajo Do resonante' },
    { id: 3, label: '3. RE Suspenso Divertido', action: () => soundEngine.play3_ReSuspensoDivertido(), desc: 'Arpegio en Re juguetón' },
    { id: 4, label: '4. RE Suspenso Acelerado', action: () => soundEngine.play4_ReSuspensoDivertidoAcelerado(), desc: 'Tempo rápido y cómico' },
    { id: 5, label: '5. DO Suspenso Lento', action: () => soundEngine.play5_DoSuspensoLento(), desc: 'Tono misterioso con curva' },
    { id: 6, label: '6. DO Suspenso Lento Fuerte', action: () => soundEngine.play6_DoSuspensoLentoFuerte(), desc: 'Impacto orquestal dramático' },
    { id: 7, label: '7. MI Motivación', action: () => soundEngine.play7_MiMotivacion(), desc: 'Fanfarria heroica en Mi' },
    { id: 8, label: '8. MI Miedo', action: () => soundEngine.play8_MiMiedo(), desc: 'Trémolo disonante misterioso' },
    { id: 9, label: '9. DO# Infinito', action: () => soundEngine.play9_DoSostenidoInfinito(), desc: 'Drone ambiental sostenido' },
    { id: 10, label: '10. DO# Vibrante Cósmico', action: () => soundEngine.play10_DoSostenidoInfinitoVibrante(), desc: 'Pad armónico pulsante' },
  ];

  return (
    <div className="relative z-40">
      <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-lg">
        <button
          onClick={toggleMute}
          title={muted ? 'Activar Sonido' : 'Silenciar'}
          className={`p-1.5 rounded-full transition ${
            muted ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            setShowSoundboard(!showSoundboard);
          }}
          className="flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 transition px-2 py-0.5 rounded-md hover:bg-amber-400/10"
        >
          <Music className="w-3.5 h-3.5" />
          <span>Efectos DO/RE/MI (10)</span>
          {showSoundboard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showSoundboard && (
        <div className="absolute right-0 top-11 w-80 max-h-96 overflow-y-auto bg-slate-900/95 backdrop-blur-lg border border-emerald-500/40 rounded-2xl p-3 shadow-2xl space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Sintetizador de Efectos (10 Sonidos)
            </span>
            <button
              onClick={() => soundEngine.stopInfiniteDrone()}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600"
            >
              Detener Drone
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {soundboardItems.map(item => (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-start p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700/60 hover:border-emerald-500/50 transition text-left group"
              >
                <span className="text-xs font-bold text-amber-300 group-hover:text-emerald-300">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
