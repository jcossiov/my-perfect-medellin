import React, { useState } from 'react';
import { CITY_LOCATIONS } from '../data/gameData';
import { soundEngine } from '../utils/audio';
import { MapPin, Info, Gift, Check, X } from 'lucide-react';

interface CityMapModalProps {
  visitedLocations: string[];
  onClaimLocationReward: (id: string) => void;
  onClose: () => void;
}

export const CityMapModal: React.FC<CityMapModalProps> = ({
  visitedLocations,
  onClaimLocationReward,
  onClose,
}) => {
  const [selectedLoc, setSelectedLoc] = useState(CITY_LOCATIONS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-sky-500/40 w-full max-w-4xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-fun text-sky-400">Conoce la Ciudad: Medellín Sostenible</h2>
              <p className="text-xs text-slate-400">Explora los lugares más representativos del Valle de Aburrá y aprende de su cultura cívica</p>
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

        {/* Map Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4 overflow-y-auto pr-2">
          {/* Left Places List */}
          <div className="md:col-span-6 space-y-2.5">
            {CITY_LOCATIONS.map(loc => {
              const isVisited = visitedLocations.includes(loc.id);
              const isSelected = selectedLoc.id === loc.id;

              return (
                <button
                  key={loc.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedLoc(loc);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400 shadow-md shadow-sky-500/10'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-slate-900">{loc.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-white block">{loc.name}</span>
                      <span className="text-[10px] text-sky-300 font-semibold">{loc.badge}</span>
                    </div>
                  </div>
                  <div>
                    {isVisited ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Visitado
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                        +Premio
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Location Detail View */}
          <div className="md:col-span-6 bg-slate-950/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">{selectedLoc.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedLoc.name}</h3>
                  <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30">
                    {selectedLoc.badge}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Descripción Cultural
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedLoc.description}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                    <Info className="w-4 h-4" />
                    <span>Dato Ecológico Paisa</span>
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">{selectedLoc.ecoTip}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              {visitedLocations.includes(selectedLoc.id) ? (
                <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Check className="w-4 h-4" />
                  <span>¡Ya reclamaste el premio de este lugar!</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    soundEngine.playRecycleSuccess();
                    onClaimLocationReward(selectedLoc.id);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 hover:from-sky-300 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition"
                >
                  <Gift className="w-4 h-4" />
                  <span>Reclamar Recompensa Paisa (+50 Monedas y +1 Gema)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
