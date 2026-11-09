import { LEVELS, ALBUM_FACTS } from '../data/gameData';
import { sound } from '../utils/audio';

interface Props {
  unlockedLevel: number;
  onClose: () => void;
}

export function AlbumModal({ unlockedLevel, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-4 border-rose-400 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📖</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                Álbum de Tesoros de Medellín
              </h2>
              <p className="text-xs font-semibold text-rose-700">
                ¡Cada nivel completado desbloquea una postal y un dato curioso!
              </p>
            </div>
          </div>
          <button
            onClick={() => { sound.click(); onClose(); }}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Grid de las 10 Láminas del Álbum */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LEVELS.map((lvl) => {
            const isUnlocked = lvl.number < unlockedLevel; // Nivel superado
            const fact = ALBUM_FACTS[lvl.number];

            return (
              <div
                key={lvl.number}
                className={`p-4 rounded-2xl border-2 flex flex-col justify-between gap-2.5 transition ${
                  isUnlocked
                    ? 'bg-rose-50/50 border-rose-200 shadow-sm'
                    : 'bg-slate-100 border-dashed border-slate-300 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl border ${
                      isUnlocked
                        ? 'bg-white border-rose-200 shadow-sm'
                        : 'bg-slate-200 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isUnlocked ? lvl.emoji : '🔒'}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-rose-600 block">
                      Lámina #{lvl.number}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">
                      {lvl.place}
                    </h4>
                  </div>
                </div>

                {isUnlocked ? (
                  <p className="text-xs font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-rose-100">
                    💡 {fact}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">
                    Gana el Nivel {lvl.number} para revelar el secreto de este lugar.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Cerrar */}
        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={() => { sound.click(); onClose(); }}
            className="px-6 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition"
          >
            Cerrar Álbum
          </button>
        </div>
      </div>
    </div>
  );
}
