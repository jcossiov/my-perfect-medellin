import React, { useState } from 'react';
import { ShopItem, PlayerEconomy } from '../types/game';
import { soundEngine } from '../utils/audio';
import { ShoppingBag, Sparkles, Check, X } from 'lucide-react';

interface ShopModalProps {
  items: ShopItem[];
  economy: PlayerEconomy;
  onBuyItem: (item: ShopItem) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  items,
  economy,
  onBuyItem,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const filteredItems = items.filter(i =>
    selectedCategory === 'todos' ? true : i.category === selectedCategory
  );

  const canAfford = (item: ShopItem) => {
    if (item.currency === 'coinsNormal') return economy.coinsNormal >= item.price;
    if (item.currency === 'coinsSuprema') return economy.coinsSuprema >= item.price;
    if (item.currency === 'coinsImposible') return economy.coinsImposible >= item.price;
    if (item.currency === 'gems') return economy.gems >= item.price;
    if (item.currency === 'score') return economy.score >= item.price;
    return false;
  };

  const getCurrencyLabel = (currency: string) => {
    switch (currency) {
      case 'coinsNormal':
        return '🪙 Normal';
      case 'coinsSuprema':
        return '⭐ Suprema';
      case 'coinsImposible':
        return '💎 Imposible';
      case 'gems':
        return '💎 Gema';
      case 'score':
        return '🎯 Puntos';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-4xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-fun text-emerald-400">Stand de Doña Luz</h2>
              <p className="text-xs text-slate-400">Compra mejoras, botas turbo, ganchos y reliquias con tus puntos y monedas</p>
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

        {/* Currency balances bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 bg-slate-950/60 rounded-2xl border border-slate-800 my-3 text-xs">
          <span className="font-bold text-slate-400">Tus Fondos Disponibles:</span>
          <div className="flex items-center gap-4 font-bold">
            <span className="text-amber-400">🪙 {economy.coinsNormal} Normal</span>
            <span className="text-amber-200">⭐ {economy.coinsSuprema} Suprema</span>
            <span className="text-cyan-300">💎 {economy.coinsImposible} Imposible</span>
            <span className="text-emerald-400">💠 {economy.gems} Gemas</span>
            <span className="text-rose-400">🎯 {economy.score} Pts</span>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 pb-2">
          {['todos', 'poder', 'herramienta', 'accesorio', 'incubadora'].map(cat => (
            <button
              key={cat}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 overflow-y-auto py-3 pr-2">
          {filteredItems.map(item => {
            const affordable = canAfford(item);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition ${
                  item.owned
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : affordable
                    ? 'bg-slate-950/70 border-slate-700 hover:border-emerald-500/40'
                    : 'bg-slate-950/30 border-slate-800 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {item.icon}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300">
                    {item.price} {getCurrencyLabel(item.currency)}
                  </span>

                  {item.owned ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Adquirido
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (affordable) {
                          soundEngine.play7_MiMotivacion();
                          onBuyItem(item);
                        } else {
                          soundEngine.play8_MiMiedo();
                        }
                      }}
                      disabled={!affordable}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        affordable
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Comprar</span>
                    </button>
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
