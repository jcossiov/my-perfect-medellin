import React, { useState } from 'react';
import { ClanMember, PlayerEconomy } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Users, Shield, Plus, Check, Lock, X } from 'lucide-react';

interface ClanModalProps {
  clanName: string;
  onUpdateClanName: (name: string) => void;
  clanMembers: ClanMember[];
  currentLevel: number;
  economy: PlayerEconomy;
  onRecruitMember: (memberId: string, cost: number) => void;
  onClose: () => void;
}

export const ClanModal: React.FC<ClanModalProps> = ({
  clanName,
  onUpdateClanName,
  clanMembers,
  currentLevel,
  economy,
  onRecruitMember,
  onClose,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(clanName);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateClanName(nameInput.trim());
      setEditingName(false);
      soundEngine.playClick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-purple-500/40 w-full max-w-3xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className="bg-slate-800 border border-purple-500/50 text-white px-2 py-0.5 rounded-lg text-sm font-bold"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-2 py-0.5 bg-purple-500 text-slate-950 font-bold text-xs rounded-lg"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <h2
                    onClick={() => setEditingName(true)}
                    className="text-xl font-bold font-fun text-purple-400 cursor-pointer hover:underline flex items-center gap-1.5"
                    title="Haz clic para cambiar el nombre de tu clan"
                  >
                    <span>Clan: {clanName}</span>
                    <span className="text-xs text-purple-300 font-sans">✏️</span>
                  </h2>
                )}
              </div>
              <p className="text-xs text-slate-400">Crea tu familia o clan paisa desbloqueando miembros por nivel</p>
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

        {/* Member cards */}
        <div className="overflow-y-auto py-4 space-y-3.5 pr-2">
          {clanMembers.map(member => {
            const isLevelUnlocked = currentLevel >= member.unlockedAtLevel;
            const canAfford = economy.coinsNormal >= member.cost;

            return (
              <div
                key={member.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  member.isRecruited
                    ? 'bg-purple-950/30 border-purple-500/50'
                    : isLevelUnlocked
                    ? 'bg-slate-950/60 border-slate-700'
                    : 'bg-slate-950/30 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-4xl p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                    {member.avatar}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{member.name}</h4>
                      <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md font-semibold">
                        {member.role}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium mt-1">
                      ⭐ {member.bonusDescription}
                    </p>
                    {!isLevelUnlocked && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3" /> Se desbloquea en Nivel {member.unlockedAtLevel}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {member.isRecruited ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                      <Check className="w-4 h-4" />
                      <span>En la Familia</span>
                    </div>
                  ) : isLevelUnlocked ? (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          soundEngine.play7_MiMotivacion();
                          onRecruitMember(member.id, member.cost);
                        } else {
                          soundEngine.play8_MiMiedo();
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        canAfford
                          ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg shadow-purple-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Reclutar ({member.cost} 🪙)</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-semibold flex items-center gap-1 border border-slate-700">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloqueado</span>
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
