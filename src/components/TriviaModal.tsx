import { useState } from 'react';
import { QUESTIONS, type Question } from '../data/gameData';
import { sound } from '../utils/audio';

interface Props {
  answered: string[];
  onCorrectAnswer: (questionId: string, reward: number) => void;
  onClose: () => void;
}

export function TriviaModal({ answered, onCorrectAnswer, onClose }: Props) {
  const [selectedQ, setSelectedQ] = useState<Question | null>(null);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);

  const handleSelectOption = (idx: number) => {
    if (!selectedQ || showResult) return;
    setChosenIdx(idx);
    setShowResult(true);

    if (idx === selectedQ.correct) {
      sound.correct();
      sound.coin();
      if (!answered.includes(selectedQ.id)) {
        onCorrectAnswer(selectedQ.id, selectedQ.reward);
      }
    } else {
      sound.wrong();
    }
  };

  const resetSelection = () => {
    setSelectedQ(null);
    setChosenIdx(null);
    setShowResult(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-4 border-purple-400 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">💬</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">Preguntas Paisas</h2>
              <p className="text-xs font-semibold text-purple-700">
                ¡Aprende con los personajes de Medellín y gana monedas 🪙!
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

        {/* Vista de Pregunta Individual */}
        {selectedQ ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-2xl border-2 border-purple-200">
              <span className="text-4xl">{selectedQ.avatar}</span>
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">
                  {selectedQ.who} dice:
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-800">
                  {selectedQ.question}
                </p>
              </div>
            </div>

            {/* Opciones */}
            <div className="flex flex-col gap-2.5">
              {selectedQ.options.map((opt, i) => {
                let btnStyle = 'bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-800';
                if (showResult) {
                  if (i === selectedQ.correct) {
                    btnStyle = 'bg-green-100 border-green-500 text-green-900 font-black';
                  } else if (i === chosenIdx) {
                    btnStyle = 'bg-red-100 border-red-500 text-red-900 font-bold';
                  } else {
                    btnStyle = 'bg-slate-100 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={i}
                    disabled={showResult}
                    onClick={() => handleSelectOption(i)}
                    className={`p-3.5 rounded-2xl border-2 text-left text-sm sm:text-base font-semibold transition active:scale-[0.99] flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {showResult && i === selectedQ.correct && <span>✅</span>}
                    {showResult && i === chosenIdx && i !== selectedQ.correct && <span>❌</span>}
                  </button>
                );
              })}
            </div>

            {/* Explicación si ya respondió */}
            {showResult && (
              <div
                className={`p-4 rounded-2xl border-2 text-sm sm:text-base font-semibold ${
                  chosenIdx === selectedQ.correct
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <p className="font-bold mb-1">
                  {chosenIdx === selectedQ.correct
                    ? `¡Excelente! Ganaste +${selectedQ.reward} monedas 🪙`
                    : '¡Casi lo logras!'}
                </p>
                <p>{selectedQ.explain}</p>
              </div>
            )}

            {/* Botón Volver a la Lista */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => { sound.click(); resetSelection(); }}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition"
              >
                Volver a la lista de preguntas
              </button>
            </div>
          </div>
        ) : (
          /* Lista de Preguntas Disponibles */
          <div className="flex flex-col gap-2.5">
            {QUESTIONS.map((q) => {
              const isDone = answered.includes(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    sound.click();
                    setSelectedQ(q);
                  }}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition active:scale-[0.99] ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
                      : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-1.5 rounded-xl bg-slate-50 border">
                      {q.avatar}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">
                        {q.who}
                      </span>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-200 text-emerald-900 text-xs font-black">
                        ✓ Resuelto
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">
                        +{q.reward} 🪙
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
