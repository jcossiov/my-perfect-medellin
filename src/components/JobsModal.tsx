import React from 'react';
import { Job, PlayerEconomy } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Briefcase, Clock, CheckCircle2, Lock, X } from 'lucide-react';

interface JobsModalProps {
  jobs: Job[];
  currentLevel: number;
  economy: PlayerEconomy;
  onWorkJob: (job: Job) => void;
  onClose: () => void;
}

export const JobsModal: React.FC<JobsModalProps> = ({
  jobs,
  currentLevel,
  economy,
  onWorkJob,
  onClose,
}) => {
  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-3xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-fun text-amber-400">Trabajos de Medellín</h2>
              <p className="text-xs text-slate-400">Consigue empleo en los lugares más verdes de la ciudad y gana monedas</p>
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

        {/* Jobs List */}
        <div className="overflow-y-auto py-4 space-y-3.5 pr-2">
          {jobs.map(job => {
            const isUnlocked = currentLevel >= job.minLevel;
            const timePassed = now - job.lastWorked;
            const isReady = timePassed >= job.cooldown;
            const remaining = Math.max(0, job.cooldown - timePassed);

            return (
              <div
                key={job.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !isUnlocked
                    ? 'bg-slate-950/30 border-slate-800 opacity-60'
                    : isReady
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-4xl p-2.5 rounded-2xl bg-slate-800">{job.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{job.title}</h3>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-semibold">
                        {job.location}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">{job.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-bold text-slate-300">
                      <span>Salario:</span>
                      <span className="text-amber-400">🪙 +{job.salaryNormal} Normal</span>
                      <span className="text-amber-200">⭐ +{job.salarySuprema} Suprema</span>
                    </div>
                  </div>
                </div>

                <div>
                  {!isUnlocked ? (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-semibold flex items-center gap-1 border border-slate-700">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Nivel {job.minLevel}</span>
                    </div>
                  ) : isReady ? (
                    <button
                      onClick={() => {
                        soundEngine.playRecycleSuccess();
                        onWorkJob(job);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hacer Turno</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-mono flex items-center gap-1.5 border border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>{remaining}s espera</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
