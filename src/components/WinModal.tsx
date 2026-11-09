import type { GameResult } from '../game/engine';
import { sound } from '../utils/audio';

interface Props {
  result: GameResult;
  levelNumber: number;
  levelTitle: string;
  onNextLevel: () => void;
  onRetry: () => void;
  onMap: () => void;
}

export function WinModal({
  result,
  levelNumber,
  levelTitle,
  onNextLevel,
  onRetry,
  onMap,
}: Props) {
  const isWin = result.win;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border-4 border-yellow-400 flex flex-col items-center gap-4 animate-scale-up">
        {/* Emoji de Cabecera */}
        <div className="text-6xl sm:text-7xl">
          {isWin ? (result.stars === 3 ? '🏆' : '🎉') : '😢'}
        </div>

        {/* Título */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
            {isWin ? '¡NIVEL COMPLETADO!' : '¡SE ACABÓ EL TIEMPO!'}
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Nivel {levelNumber}: {levelTitle}
          </p>
        </div>

        {/* Estrellas si ganó */}
        {isWin && (
          <div className="flex gap-2 text-4xl">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={s <= result.stars ? 'text-amber-400 drop-shadow' : 'text-slate-200'}
              >
                ★
              </span>
            ))}
          </div>
        )}

        {/* Resumen de Recompensas */}
        <div className="bg-slate-50 w-full p-4 rounded-2xl border-2 border-slate-200 flex justify-around text-center">
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">
              Monedas
            </span>
            <span className="text-xl font-black text-amber-900 flex items-center justify-center gap-1">
              <span>🪙</span>
              <span>+{result.coins}</span>
            </span>
          </div>
          <div className="border-x border-slate-200 px-4">
            <span className="text-xs font-bold text-slate-400 block uppercase">
              Reciclados
            </span>
            <span className="text-xl font-black text-emerald-800 flex items-center justify-center gap-1">
              <span>♻️</span>
              <span>{result.sorted}</span>
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">
              Fallos
            </span>
            <span className="text-xl font-black text-slate-700">
              {result.mistakes}
            </span>
          </div>
        </div>

        {/* Mensaje motivacional */}
        <p className="text-sm font-semibold text-slate-600">
          {isWin
            ? '¡Medellín está más limpia y hermosa gracias a tu ayuda! 🌺'
            : '¡No te desanimes! Inténtalo de nuevo, tú puedes lograrlo 💪'}
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          {isWin && levelNumber < 10 && (
            <button
              onClick={() => { sound.click(); onNextLevel(); }}
              className="btn-big bg-green-500 hover:bg-green-400 text-white w-full shadow-lg shadow-green-500/30"
            >
              ▶ Siguiente Nivel
            </button>
          )}

          <button
            onClick={() => { sound.click(); onRetry(); }}
            className={`btn-big w-full ${
              !isWin
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            🔄 Jugar de Nuevo
          </button>

          <button
            onClick={() => { sound.click(); onMap(); }}
            className="btn-big bg-sky-500 hover:bg-sky-400 text-white w-full"
          >
            🗺️ Volver al Mapa
          </button>
        </div>
      </div>
    </div>
  );
}
