import React, { useState } from 'react';
import { NPCDialog } from '../types/game';
import { soundEngine } from '../utils/audio';
import { MessageSquare, CheckCircle, AlertTriangle, Sparkles, X } from 'lucide-react';

interface NPCModalProps {
  dialog: NPCDialog;
  onAnswer: (isCorrect: boolean, rewardCoinsNormal?: number, rewardCoinsSuprema?: number, rewardGems?: number) => void;
  onClose: () => void;
}

export const NPCModal: React.FC<NPCModalProps> = ({
  dialog,
  onAnswer,
  onClose,
}) => {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelectedOptionIdx(idx);
    soundEngine.playClick();
  };

  const handleSubmit = () => {
    if (selectedOptionIdx === null) return;
    setSubmitted(true);
    const chosen = dialog.options[selectedOptionIdx];
    if (chosen.isCorrect) {
      soundEngine.play7_MiMotivacion();
      onAnswer(true, chosen.rewardCoinsNormal, chosen.rewardCoinsSuprema, chosen.rewardGems);
    } else {
      soundEngine.play8_MiMiedo();
      onAnswer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-xl rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl p-2 rounded-2xl bg-slate-800 border border-slate-700">
              {dialog.avatar}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{dialog.npcName}</h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                  {dialog.npcRole}
                </span>
              </div>
              <p className="text-xs text-slate-400">{dialog.location}</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dialog bubble */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 relative z-10 space-y-2">
          <p className="italic text-amber-200/90 font-medium">"{dialog.situation}"</p>
          <div className="font-bold text-white text-sm flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>{dialog.question}</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2.5 relative z-10">
          {dialog.options.map((opt, idx) => {
            const isSelected = selectedOptionIdx === idx;

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={submitted}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs font-semibold transition flex items-start gap-3 ${
                  submitted && isSelected
                    ? opt.isCorrect
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : isSelected
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 text-[10px]">
                  {String.fromCharCode(65 + idx)}
                </div>
                <div className="flex-1">
                  <span>{opt.text}</span>
                  {submitted && isSelected && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[11px] font-normal leading-relaxed">
                      {opt.explanation}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between relative z-10">
          <span className="text-[11px] text-slate-400">
            {!submitted ? 'Elige la opción más cívica y solidaria' : '¡Decisión evaluada!'}
          </span>

          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOptionIdx === null}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 ${
                selectedOptionIdx !== null
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Confirmar Decisión</span>
            </button>
          ) : (
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition"
            >
              Continuar la Misión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
