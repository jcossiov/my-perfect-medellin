import { SHOP, type ShopId } from '../data/gameData';
import { sound } from '../utils/audio';

interface Props {
  coins: number;
  owned: ShopId[];
  onBuyItem: (itemId: ShopId, price: number) => void;
  onClose: () => void;
}

export function ShopModal({ coins, owned, onBuyItem, onClose }: Props) {
  const poderes = SHOP.filter((item) => item.kind === 'poder');
  const ropa = SHOP.filter((item) => item.kind === 'ropa');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border-4 border-amber-400 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛍️</span>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Tienda Ecológica Paisa</h2>
              <p className="text-xs font-semibold text-slate-500">
                ¡Compra poderes para reciclar más rápido o ropa para tu muñeco!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-100 border-2 border-amber-300 px-3.5 py-1 rounded-2xl">
              <span className="text-2xl">🪙</span>
              <span className="text-lg font-black text-amber-900">{coins}</span>
            </div>
            <button
              onClick={() => { sound.click(); onClose(); }}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sección Poderes */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
            <span>⚡</span>
            <span>Súper Poderes Útiles (Efecto Inmediato)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {poderes.map((item) => {
              const isOwned = owned.includes(item.id);
              const canAfford = coins >= item.price;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                    isOwned
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-slate-50 border">
                      {item.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>

                  {isOwned ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-200 text-emerald-900 text-xs font-black">
                      ✓ Comprado
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        sound.coin();
                        onBuyItem(item.id, item.price);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                        canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>🪙</span>
                      <span>{item.price}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección Ropa y Accesorios */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
            <span>👒</span>
            <span>Ropa y Accesorios con Estilo</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ropa.map((item) => {
              const isOwned = owned.includes(item.id);
              const canAfford = coins >= item.price;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                    isOwned
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-white border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-slate-50 border">
                      {item.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>

                  {isOwned ? (
                    <span className="px-3 py-1 rounded-xl bg-purple-200 text-purple-900 text-xs font-black">
                      ✓ En Armario
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        sound.coin();
                        onBuyItem(item.id, item.price);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                        canAfford
                          ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-sm active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>🪙</span>
                      <span>{item.price}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cerrar */}
        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={() => { sound.click(); onClose(); }}
            className="px-6 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
