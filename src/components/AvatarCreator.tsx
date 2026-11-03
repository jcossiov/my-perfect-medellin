import React from 'react';
import { PlayerAvatar } from '../types/game';
import { soundEngine } from '../utils/audio';
import { User, Sparkles, Check, Palette } from 'lucide-react';

interface AvatarCreatorProps {
  avatar: PlayerAvatar;
  onUpdateAvatar: (updated: PlayerAvatar) => void;
  onClose: () => void;
}

export const AvatarCreator: React.FC<AvatarCreatorProps> = ({
  avatar,
  onUpdateAvatar,
  onClose,
}) => {
  const skinTones = [
    { label: 'Claro', value: '#ffd1b3' },
    { label: 'Canela', value: '#e0ac69' },
    { label: 'Moreno', value: '#b27a3c' },
    { label: 'Bronce', value: '#8d5524' },
    { label: 'Oscuro', value: '#50331a' },
  ];

  const hairColors = [
    { label: 'Castaño', value: '#4a2c11' },
    { label: 'Negro', value: '#1a1a1a' },
    { label: 'Rubio', value: '#d4af37' },
    { label: 'Cobrizo', value: '#9c411c' },
    { label: 'Verde Neón', value: '#10b981' },
  ];

  const outfits = [
    { id: 'paisa_tradicional', name: 'Paisa Tradicional', desc: 'Poncho paisa, carriel y camisa campesina' },
    { id: 'urbano_medellin', name: 'Urbano Comuna 13', desc: 'Sudadera fresca, estilo hip-hop paisa' },
    { id: 'superheroe_ecologico', name: 'Héroe Esmeralda', desc: 'Traje de guardián de la biodiversidad' },
    { id: 'metro_conductor', name: 'Cultura Metro', desc: 'Chaqueta de la gran red de transporte limpio' },
  ] as const;

  const accessories = [
    { id: 'sombrero_vueltiao', name: 'Sombrero Vueltiao', icon: '🤠' },
    { id: 'carriel', name: 'Carriel de Jericó', icon: '🎒' },
    { id: 'gafas_neon', name: 'Gafas Neón', icon: '🕶️' },
    { id: 'auriculares', name: 'Auriculares Urbanos', icon: '🎧' },
    { id: 'capa_verde', name: 'Capa Protectora', icon: '🌱' },
    { id: 'ninguno', name: 'Sin Accesorio', icon: '✖️' },
  ] as const;

  const auras = [
    { label: 'Verde Medellín', value: '#10b981' },
    { label: 'Dorado Guayacán', value: '#f59e0b' },
    { label: 'Azul Río Aburrá', value: '#06b6d4' },
    { label: 'Magenta Orquídea', value: '#ec4899' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-3xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-fun text-emerald-400">Crea tu Muñeco Paisa</h2>
              <p className="text-xs text-slate-400">Personaliza a tu héroe o heroína de My Perfect Medellín</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.play7_MiMotivacion();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition"
          >
            <Check className="w-4 h-4" />
            <span>Listo para Jugar</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 overflow-y-auto pr-2">
          {/* Left Preview Column */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
            {/* Aura Glow */}
            <div
              className="absolute w-44 h-44 rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none"
              style={{ backgroundColor: avatar.auraColor }}
            />

            {/* Character Visual Avatar */}
            <div className="relative z-10 flex flex-col items-center animate-float-bob">
              {/* Accessory above head (Hat) */}
              {avatar.accessory === 'sombrero_vueltiao' && (
                <div className="text-4xl -mb-3 z-20">🤠</div>
              )}
              {avatar.accessory === 'auriculares' && (
                <div className="text-3xl -mb-2 z-20">🎧</div>
              )}

              {/* Head */}
              <div
                className="w-20 h-20 rounded-full border-4 border-slate-900 shadow-xl relative flex items-center justify-center transition-colors"
                style={{ backgroundColor: avatar.skinTone }}
              >
                {/* Hair */}
                <div
                  className="absolute -top-2 w-16 h-7 rounded-t-full transition-colors"
                  style={{ backgroundColor: avatar.hairColor }}
                />

                {/* Eyes */}
                <div className="flex gap-4">
                  <div className="w-3 h-3 rounded-full bg-slate-900 relative">
                    <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-slate-900 relative">
                    <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
                  </div>
                </div>

                {/* Glasses */}
                {avatar.accessory === 'gafas_neon' && (
                  <div className="absolute text-xl z-20">🕶️</div>
                )}

                {/* Smile */}
                <div className="absolute bottom-3 w-4 h-2 border-b-2 border-slate-800 rounded-full" />
              </div>

              {/* Torso / Clothes */}
              <div
                className={`w-24 h-24 rounded-2xl mt-2 flex flex-col items-center justify-center text-white relative shadow-lg ${
                  avatar.outfit === 'paisa_tradicional'
                    ? 'bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-amber-500'
                    : avatar.outfit === 'urbano_medellin'
                    ? 'bg-gradient-to-b from-indigo-600 to-purple-800 border-2 border-purple-400'
                    : avatar.outfit === 'superheroe_ecologico'
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-800 border-2 border-emerald-300'
                    : 'bg-gradient-to-b from-amber-500 to-sky-700 border-2 border-cyan-400'
                }`}
              >
                {/* Carriel bag icon */}
                {avatar.accessory === 'carriel' && (
                  <div className="absolute top-2 right-1 text-lg">🎒</div>
                )}
                {avatar.accessory === 'capa_verde' && (
                  <div className="absolute -left-3 top-2 text-2xl -rotate-12">🌱</div>
                )}

                <span className="text-2xl font-bold">
                  {avatar.gender === 'chico' ? '👦' : '👧'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200 mt-1">
                  {avatar.outfit.replace('_', ' ')}
                </span>
              </div>

              {/* Legs */}
              <div className="flex gap-3 -mt-1">
                <div className="w-4 h-8 bg-slate-800 rounded-b-md" />
                <div className="w-4 h-8 bg-slate-800 rounded-b-md" />
              </div>
            </div>

            {/* Hero Name Badge */}
            <div className="mt-4 text-center z-10">
              <input
                type="text"
                value={avatar.name}
                onChange={e => onUpdateAvatar({ ...avatar, name: e.target.value })}
                className="bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold px-3 py-1 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Nombre de tu héroe"
              />
              <span className="block text-[11px] text-slate-400 mt-1">
                {avatar.gender === 'chico' ? 'Héroe Paisa' : 'Heroína Paisa'}
              </span>
            </div>
          </div>

          {/* Right Controls Column */}
          <div className="md:col-span-7 space-y-4">
            {/* Género */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                1. Género del Personaje
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateAvatar({ ...avatar, gender: 'chico' });
                  }}
                  className={`p-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition ${
                    avatar.gender === 'chico'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-lg">👦</span>
                  <span>Chico (Héroe)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateAvatar({ ...avatar, gender: 'chica' });
                  }}
                  className={`p-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition ${
                    avatar.gender === 'chica'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-lg">👧</span>
                  <span>Chica (Heroína)</span>
                </button>
              </div>
            </div>

            {/* Tono de piel */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                2. Tono de Piel
              </label>
              <div className="flex gap-2">
                {skinTones.map(tone => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateAvatar({ ...avatar, skinTone: tone.value });
                    }}
                    style={{ backgroundColor: tone.value }}
                    title={tone.label}
                    className={`w-9 h-9 rounded-xl border-2 transition transform hover:scale-105 ${
                      avatar.skinTone === tone.value
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Color de Cabello */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                3. Color de Cabello
              </label>
              <div className="flex gap-2">
                {hairColors.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateAvatar({ ...avatar, hairColor: c.value });
                    }}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                    className={`w-9 h-9 rounded-xl border-2 transition transform hover:scale-105 ${
                      avatar.hairColor === c.value
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Traje / Outfit */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                4. Traje y Estilo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {outfits.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateAvatar({ ...avatar, outfit: o.id });
                    }}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      avatar.outfit === o.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{o.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{o.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accesorios Paisas */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                5. Accesorio de Medellín
              </label>
              <div className="grid grid-cols-3 gap-2">
                {accessories.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateAvatar({ ...avatar, accessory: acc.id });
                    }}
                    className={`p-2 rounded-xl text-center border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      avatar.accessory === acc.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{acc.icon}</span>
                    <span className="text-[11px] truncate">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aura de Poder */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                6. Aura Ecológica
              </label>
              <div className="flex gap-2">
                {auras.map(a => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateAvatar({ ...avatar, auraColor: a.value });
                    }}
                    style={{ backgroundColor: a.value }}
                    title={a.label}
                    className={`w-9 h-9 rounded-xl border-2 transition ${
                      avatar.auraColor === a.value
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
