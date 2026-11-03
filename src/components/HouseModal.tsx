import React from 'react';
import { House, PlayerEconomy } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Home, Sun, CloudRain, Flower2, Check, Lock, X } from 'lucide-react';

interface HouseModalProps {
  houses: House[];
  activeHouseId: string;
  economy: PlayerEconomy;
  onSelectHouse: (id: string) => void;
  onBuyHouse: (house: House) => void;
  onBuyUpgrade: (houseId: string, itemId: string, cost: number, coinType: string) => void;
  onClose: () => void;
}

export const HouseModal: React.FC<HouseModalProps> = ({
  houses,
  activeHouseId,
  economy,
  onSelectHouse,
  onBuyHouse,
  onBuyUpgrade,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-4xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-fun text-emerald-400">Tu Hogar en Medellín</h2>
              <p className="text-xs text-slate-400">Compra o gana tu casa ecológica y mejórala con energías limpias</p>
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

        {/* Houses List */}
        <div className="overflow-y-auto py-4 space-y-5 pr-2">
          {houses.map(house => {
            const isSelected = activeHouseId === house.id;

            return (
              <div
                key={house.id}
                className={`rounded-2xl border p-5 transition ${
                  isSelected
                    ? 'bg-slate-850 border-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl p-2 rounded-2xl bg-slate-800">
                      {house.type === 'casita_guayacan' ? '🏡' : house.type === 'cabana_santa_elena' ? '🌲' : '🏙️'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{house.name}</h3>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                            CASA ACTIVA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{house.description}</p>
                    </div>
                  </div>

                  <div>
                    {house.unlocked ? (
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          onSelectHouse(house.id);
                        }}
                        disabled={isSelected}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-black cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4" /> : null}
                        <span>{isSelected ? 'Habitando Aquí' : 'Mudarme Aquí'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (economy.coinsNormal >= house.cost) {
                            soundEngine.play7_MiMotivacion();
                            onBuyHouse(house);
                          } else {
                            soundEngine.play8_MiMiedo();
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          economy.coinsNormal >= house.cost
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Comprar por 🪙 {house.cost} Monedas</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Eco Upgrades for this house */}
                {house.unlocked && (
                  <div className="pt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                      Mejoras Ecológicas del Hogar
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {house.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-slate-200">{item.name}</div>
                              <div className="text-[10px] text-emerald-400">{item.bonus}</div>
                            </div>
                          </div>
                          <div>
                            {item.purchased ? (
                              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                                <Check className="w-3 h-3" /> Instalado
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  const balance =
                                    item.coinType === 'coinsNormal'
                                      ? economy.coinsNormal
                                      : item.coinType === 'coinsSuprema'
                                      ? economy.coinsSuprema
                                      : economy.coinsImposible;

                                  if (balance >= item.cost) {
                                    soundEngine.playRecycleSuccess();
                                    onBuyUpgrade(house.id, item.id, item.cost, item.coinType);
                                  } else {
                                    soundEngine.play8_MiMiedo();
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition"
                              >
                                {item.cost}{' '}
                                {item.coinType === 'coinsNormal'
                                  ? '🪙 Cobre'
                                  : item.coinType === 'coinsSuprema'
                                  ? '⭐ Suprema'
                                  : '💎 Imposible'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
