import React from 'react';
import { Sparkles, Droplets, Zap, Shield, Music } from 'lucide-react';

interface KeyboardHUDProps {
  activeKeys: Set<string>;
  onTriggerAction: (actionKey: string) => void;
  canDance?: boolean;
  powerActive?: boolean;
}

export const KeyboardHUD: React.FC<KeyboardHUDProps> = ({
  activeKeys,
  onTriggerAction,
  canDance = false,
  powerActive = false,
}) => {
  const isPressed = (key: string) => activeKeys.has(key.toLowerCase());

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Movimiento */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Mover:</span>
        <div className="flex items-center gap-1">
          {['W', 'A', 'S', 'D'].map(k => (
            <button
              key={k}
              type="button"
              onMouseDown={() => onTriggerAction(k.toLowerCase())}
              className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition shadow-sm ${
                isPressed(k)
                  ? 'bg-emerald-500 text-slate-950 scale-95 shadow-emerald-500/50'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <span className="text-slate-500 text-[10px] hidden sm:inline">o Flechas</span>
      </div>

      {/* Acciones principales */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onMouseDown={() => onTriggerAction(' ')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm ${
            isPressed(' ')
              ? 'bg-cyan-400 text-slate-950 scale-95 shadow-cyan-400/50'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>[ ESPACIO ] Limpiar / Agua</span>
        </button>

        <button
          type="button"
          onMouseDown={() => onTriggerAction('e')}
          className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
            isPressed('e')
              ? 'bg-amber-400 text-slate-950 scale-95 shadow-amber-400/50'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>[ E ] Recoger</span>
        </button>

        <button
          type="button"
          onMouseDown={() => onTriggerAction('q')}
          className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
            powerActive
              ? 'bg-fuchsia-500 text-white animate-pulse'
              : isPressed('q')
              ? 'bg-fuchsia-400 text-slate-950 scale-95'
              : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 hover:bg-fuchsia-500/30'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>[ Q ] Superpoder</span>
        </button>

        {canDance && (
          <button
            type="button"
            onMouseDown={() => onTriggerAction('r')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition animate-bounce bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 shadow-lg shadow-amber-500/30`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>[ R ] ¡Bailar!</span>
          </button>
        )}
      </div>

      {/* Teclas numéricas para Canecas */}
      <div className="hidden lg:flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Canecas:</span>
        {[
          { k: '1', name: 'Orgánico', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
          { k: '2', name: 'Plástico', color: 'bg-slate-200/20 text-slate-100 border-slate-300/40' },
          { k: '3', name: 'Papel', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40' },
          { k: '4', name: 'Vidrio', color: 'bg-teal-500/20 text-teal-400 border-teal-500/40' },
          { k: '5', name: 'Peligroso', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
          { k: '6', name: 'Chatarra', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
          { k: '7', name: 'Químico', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
        ].map(item => (
          <button
            key={item.k}
            type="button"
            title={`Caneca [${item.k}] - ${item.name}`}
            onMouseDown={() => onTriggerAction(item.k)}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition border ${
              isPressed(item.k)
                ? 'bg-amber-400 text-slate-950 scale-90 border-amber-400 shadow-md'
                : `${item.color} hover:scale-105`
            }`}
          >
            <span>[{item.k}]</span>
            <span className="text-[9px] hidden xl:inline">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
