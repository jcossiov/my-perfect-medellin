import { useState, useRef, useEffect } from 'react';
import type { Avatar, Progress } from '../utils/storage';
import { drawHero } from '../game/sprites';
import { sound } from '../utils/audio';
import { SHOP } from '../data/gameData';

interface Props {
  progress: Progress;
  onSaveAvatar: (newAvatar: Avatar) => void;
  onClose: () => void;
}

const SKIN_TONES = [
  { label: 'Claro', color: '#f7d3ba' },
  { label: 'Trigueño', color: '#e0ac69' },
  { label: 'Bronceado', color: '#c68642' },
  { label: 'Moreno', color: '#8d5524' },
  { label: 'Oscuro', color: '#51331c' },
];

const HAIR_STYLES: { id: Avatar['hair']; label: string; icon: string }[] = [
  { id: 'corto', label: 'Corto', icon: '👦' },
  { id: 'largo', label: 'Largo', icon: '👧' },
  { id: 'crespo', label: 'Crespo', icon: '🧑‍🦱' },
  { id: 'coleta', label: 'Coleta', icon: '👱‍♀️' },
  { id: 'calvo', label: 'Calvo', icon: '🧑‍🦲' },
];

const HAIR_COLORS = [
  { label: 'Negro', color: '#171717' },
  { label: 'Castaño', color: '#451a03' },
  { label: 'Rubio', color: '#eab308' },
  { label: 'Rojo', color: '#b91c1c' },
  { label: 'Azul Neón', color: '#0284c7' },
];

const SHIRT_COLORS = [
  { label: 'Verde Paisa', color: '#22c55e' },
  { label: 'Azul Río', color: '#0284c7' },
  { label: 'Rojo Flores', color: '#ef4444' },
  { label: 'Amarillo Sol', color: '#eab308' },
  { label: 'Morado Metro', color: '#a855f7' },
  { label: 'Rosa Orquídea', color: '#ec4899' },
];

export function AvatarModal({ progress, onSaveAvatar, onClose }: Props) {
  const [avatar, setAvatar] = useState<Avatar>(progress.avatar);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Renderizar avatar en vivo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawHero(ctx, avatar, 110, 110, 2.2, 1, t, false);
      t += 0.04;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [avatar]);

  const handleSave = () => {
    sound.click();
    onSaveAvatar(avatar);
    onClose();
  };

  // Accesorios que el usuario tiene comprados
  const ownedAccessories = SHOP.filter(
    (item) => item.kind === 'ropa' && progress.owned.includes(item.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-4 border-emerald-400 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👤</span>
            <h2 className="text-2xl font-black text-slate-800">Crea tu Muñeco Paisa</h2>
          </div>
          <button
            onClick={() => { sound.click(); onClose(); }}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Vista Previa del Personaje */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center bg-sky-50 rounded-3xl p-4 border-2 border-sky-100">
            <canvas
              ref={canvasRef}
              width={220}
              height={220}
              className="w-48 h-48 drop-shadow-md"
            />
            <div className="w-full mt-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nombre de tu Personaje:
              </label>
              <input
                type="text"
                maxLength={14}
                value={avatar.name}
                onChange={(e) => setAvatar({ ...avatar, name: e.target.value })}
                placeholder="Ej. Mateo, Sofía..."
                className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Opciones de Personalización */}
          <div className="sm:col-span-7 flex flex-col gap-4 text-sm font-semibold text-slate-700">
            {/* Tono de Piel */}
            <div>
              <span className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                Color de Piel
              </span>
              <div className="flex gap-2">
                {SKIN_TONES.map((s) => (
                  <button
                    key={s.color}
                    onClick={() => { sound.click(); setAvatar({ ...avatar, skin: s.color }); }}
                    style={{ backgroundColor: s.color }}
                    className={`w-9 h-9 rounded-2xl border-4 transition-transform ${
                      avatar.skin === s.color
                        ? 'border-emerald-500 scale-110 shadow-md'
                        : 'border-white hover:scale-105'
                    }`}
                    title={s.label}
                  />
                ))}
              </div>
            </div>

            {/* Estilo de Pelo */}
            <div>
              <span className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                Estilo de Cabello
              </span>
              <div className="flex flex-wrap gap-1.5">
                {HAIR_STYLES.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => { sound.click(); setAvatar({ ...avatar, hair: h.id }); }}
                    className={`px-3 py-1.5 rounded-xl border-2 font-bold flex items-center gap-1.5 transition ${
                      avatar.hair === h.id
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{h.icon}</span>
                    <span>{h.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color de Cabello */}
            <div>
              <span className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                Color de Cabello
              </span>
              <div className="flex gap-2">
                {HAIR_COLORS.map((hc) => (
                  <button
                    key={hc.color}
                    onClick={() => { sound.click(); setAvatar({ ...avatar, hairColor: hc.color }); }}
                    style={{ backgroundColor: hc.color }}
                    className={`w-8 h-8 rounded-2xl border-4 transition-transform ${
                      avatar.hairColor === hc.color
                        ? 'border-emerald-500 scale-110 shadow-md'
                        : 'border-white hover:scale-105'
                    }`}
                    title={hc.label}
                  />
                ))}
              </div>
            </div>

            {/* Camiseta */}
            <div>
              <span className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                Camiseta
              </span>
              <div className="flex gap-2 flex-wrap">
                {SHIRT_COLORS.map((sc) => (
                  <button
                    key={sc.color}
                    onClick={() => { sound.click(); setAvatar({ ...avatar, shirt: sc.color }); }}
                    style={{ backgroundColor: sc.color }}
                    className={`w-8 h-8 rounded-2xl border-4 transition-transform ${
                      avatar.shirt === sc.color
                        ? 'border-emerald-500 scale-110 shadow-md'
                        : 'border-white hover:scale-105'
                    }`}
                    title={sc.label}
                  />
                ))}
              </div>
            </div>

            {/* Accesorios Desbloqueados */}
            <div>
              <span className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                Accesorio
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { sound.click(); setAvatar({ ...avatar, accessory: 'ninguno' }); }}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition ${
                    avatar.accessory === 'ninguno'
                      ? 'bg-slate-800 text-white border-slate-900'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Ninguno
                </button>
                {ownedAccessories.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => { sound.click(); setAvatar({ ...avatar, accessory: acc.id }); }}
                    className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1 transition ${
                      avatar.accessory === acc.id
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <span>{acc.icon}</span>
                    <span>{acc.name}</span>
                  </button>
                ))}
                {ownedAccessories.length === 0 && (
                  <span className="text-xs text-slate-400 italic">
                    (Compra sombreros o gafas en la Tienda 🛍️)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end gap-3 pt-3 border-t">
          <button
            onClick={() => { sound.click(); onClose(); }}
            className="px-5 py-2.5 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black shadow-lg shadow-emerald-500/30 transition active:scale-95"
          >
            ✓ Guardar Muñeco
          </button>
        </div>
      </div>
    </div>
  );
}
