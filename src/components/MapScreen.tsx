import { LEVELS } from '../data/gameData';
import { sound } from '../utils/audio';
import type { Progress } from '../utils/storage';

interface Props {
  progress: Progress;
  onSelectLevel: (lvl: number) => void;
  onOpenAvatar: () => void;
  onOpenShop: () => void;
  onOpenTrivia: () => void;
  onOpenAlbum: () => void;
}

export function MapScreen({
  progress,
  onSelectLevel,
  onOpenAvatar,
  onOpenShop,
  onOpenTrivia,
  onOpenAlbum,
}: Props) {
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4">
      {/* Barra Superior con Recursos y Accesos Rápidos */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-xl border-4 border-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-green-500 flex items-center justify-center text-3xl shadow-md border-2 border-white">
            🌺
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>{progress.avatar.name ? progress.avatar.name : 'Guardián Paisa'}</span>
              {progress.hasDragon && <span title="¡Dragón de Guatapé!">🐲</span>}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-700">
              Cuidando a Medellín limpia y verde
            </p>
          </div>
        </div>

        {/* Monedas y Estrellas */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-100 border-2 border-amber-300 px-3.5 py-1.5 rounded-2xl shadow-sm">
            <span className="text-2xl">🪙</span>
            <span className="text-lg font-black text-amber-900">{progress.coins}</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-100 border-2 border-yellow-300 px-3.5 py-1.5 rounded-2xl shadow-sm">
            <span className="text-2xl">⭐</span>
            <span className="text-lg font-black text-yellow-900">{totalStars}/30</span>
          </div>
        </div>

        {/* Botones de Navegación del Menú */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => { sound.click(); onOpenAvatar(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-sky-100 hover:bg-sky-200 border-2 border-sky-300 text-sky-800 text-sm font-bold shadow-sm transition active:scale-95"
          >
            <span>👤</span>
            <span>Mi Muñeco</span>
          </button>
          <button
            onClick={() => { sound.click(); onOpenShop(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 text-emerald-800 text-sm font-bold shadow-sm transition active:scale-95"
          >
            <span>🛍️</span>
            <span>Tienda</span>
          </button>
          <button
            onClick={() => { sound.click(); onOpenTrivia(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-100 hover:bg-purple-200 border-2 border-purple-300 text-purple-800 text-sm font-bold shadow-sm transition active:scale-95"
          >
            <span>💬</span>
            <span>Preguntas</span>
          </button>
          <button
            onClick={() => { sound.click(); onOpenAlbum(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-100 hover:bg-rose-200 border-2 border-rose-300 text-rose-800 text-sm font-bold shadow-sm transition active:scale-95"
          >
            <span>📖</span>
            <span>Álbum</span>
          </button>
        </div>
      </div>

      {/* Título de la Ruta */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 drop-shadow-sm">
          🗺️ Mapa de Medellín: 10 Lugares Mágicos
        </h2>
        <p className="text-sm sm:text-base font-semibold text-sky-900 mt-1">
          ¡Elige un nivel, recolecta basura y vence a la contaminación!
        </p>
      </div>

      {/* Grid de los 10 Niveles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEVELS.map((lvl) => {
          const isUnlocked = lvl.number <= progress.unlocked;
          const starsEarned = progress.stars[lvl.number] || 0;

          return (
            <button
              key={lvl.number}
              disabled={!isUnlocked}
              onClick={() => {
                sound.click();
                onSelectLevel(lvl.number);
              }}
              className={`relative text-left p-4 rounded-3xl border-4 transition-all duration-200 shadow-md flex flex-col justify-between overflow-hidden group ${
                isUnlocked
                  ? 'bg-white hover:border-emerald-400 hover:shadow-xl active:scale-[0.98] border-white'
                  : 'bg-slate-200/80 border-slate-300 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl p-2 rounded-2xl bg-sky-50 border border-sky-100 group-hover:scale-110 transition-transform">
                    {lvl.emoji}
                  </span>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block">
                      Nivel {lvl.number}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base leading-tight">
                      {lvl.title}
                    </h3>
                    <span className="text-xs font-medium text-slate-500">
                      {lvl.place}
                    </span>
                  </div>
                </div>

                {/* Candado o Estrellas */}
                {!isUnlocked ? (
                  <span className="text-2xl" title="Bloqueado">🔒</span>
                ) : (
                  <div className="flex text-lg">
                    {[1, 2, 3].map((s) => (
                      <span key={s} className={s <= starsEarned ? 'text-amber-400' : 'text-slate-200'}>
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pie de tarjeta con info de canecas y villano */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <span>Villano:</span>
                  <span>{lvl.villain.icon}</span>
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl">
                  {lvl.bins.length} canecas
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
