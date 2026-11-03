import React from 'react';
import { PlayerAvatar, PlayerEconomy } from '../types/game';
import { soundEngine } from '../utils/audio';
import { Award, ShieldCheck, TreePine, Sparkles, Check, X } from 'lucide-react';

interface CitizenCardModalProps {
  avatar: PlayerAvatar;
  economy: PlayerEconomy;
  currentLevel: number;
  treesPlanted: number;
  trashRecycled: number;
  onClose: () => void;
}

export const CitizenCardModal: React.FC<CitizenCardModalProps> = ({
  avatar,
  economy,
  currentLevel,
  treesPlanted,
  trashRecycled,
  onClose,
}) => {
  const getRankByLevel = (lvl: number) => {
    if (lvl >= 10) return { title: 'Héroe Dorado de My Perfect Medellín', badge: '👑', color: 'from-amber-400 via-yellow-200 to-amber-500' };
    if (lvl >= 9) return { title: 'Protector Prehistórico del Valle', badge: '🦕', color: 'from-emerald-400 to-teal-600' };
    if (lvl >= 8) return { title: 'Domador del Dragón Sagrado', badge: '🐉', color: 'from-red-500 to-amber-600' };
    if (lvl >= 7) return { title: 'Defensor de la Cultura Metro', badge: '🚡', color: 'from-blue-500 to-cyan-400' };
    if (lvl >= 6) return { title: 'Guardián de Guayacanes Dorados', badge: '🌳', color: 'from-yellow-400 to-lime-500' };
    if (lvl >= 5) return { title: 'Maestro de la Clasificación', badge: '♻️', color: 'from-green-500 to-emerald-700' };
    if (lvl >= 4) return { title: 'Pacificador de Monstruos', badge: '✨', color: 'from-purple-500 to-indigo-600' };
    if (lvl >= 3) return { title: 'Purificador del Aire de Aburrá', badge: '💨', color: 'from-sky-400 to-blue-600' };
    if (lvl >= 2) return { title: 'Guardián de las Fuentes Hídricas', badge: '💧', color: 'from-cyan-400 to-blue-500' };
    return { title: 'Semillero Ecológico de Medellín', badge: '🌱', color: 'from-emerald-500 to-green-600' };
  };

  const rank = getRankByLevel(currentLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Holographic background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-fun text-lg font-bold text-amber-400">Identificación Cívica y Ecológica</h3>
              <p className="text-[11px] text-slate-400">Cédula Oficial de My Perfect Medellín • Nivel {currentLevel}</p>
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

        {/* Card Component */}
        <div className="mt-5 relative z-10 rounded-2xl p-5 border-2 border-amber-400/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
          {/* Card Top Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇨🇴</span>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">República de Colombia</div>
                <div className="text-xs font-black tracking-wide text-slate-100">ALCALDÍA DE MEDELLÍN • CIUDAD ECOLÓGICA</div>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-xs">
              NIVEL {currentLevel}
            </div>
          </div>

          {/* Card Body */}
          <div className="grid grid-cols-3 gap-4 my-4 items-center">
            {/* Avatar Photo Frame */}
            <div className="col-span-1 flex flex-col items-center">
              <div
                className="w-24 h-24 rounded-2xl border-2 border-amber-400/70 shadow-lg flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: avatar.skinTone }}
              >
                <div
                  className="absolute -top-1 w-16 h-6 rounded-t-full"
                  style={{ backgroundColor: avatar.hairColor }}
                />
                <span className="text-4xl mt-3">{avatar.gender === 'chico' ? '👦' : '👧'}</span>
                {avatar.accessory === 'sombrero_vueltiao' && (
                  <span className="absolute -top-1 text-2xl">🤠</span>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-center text-amber-300 py-0.5 font-bold">
                  AUTORIZADO
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">ID: MED-{avatar.name.slice(0, 3).toUpperCase()}-{currentLevel}84</span>
            </div>

            {/* Info details */}
            <div className="col-span-2 space-y-1.5">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Nombre del Ciudadano</span>
                <span className="text-base font-extrabold text-white tracking-wide">{avatar.name}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Rango Cívico Oficial</span>
                <span className={`text-xs font-black bg-gradient-to-r ${rank.color} bg-clip-text text-transparent flex items-center gap-1`}>
                  <span>{rank.badge}</span>
                  <span>{rank.title}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Estilo & Clan</span>
                <span className="text-xs font-semibold text-slate-300 capitalize">
                  {avatar.outfit.replace('_', ' ')} • Los Parceros Verdes
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/80 text-center">
            <div className="bg-slate-800/80 rounded-xl p-1.5 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Árboles Plantados</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                <TreePine className="w-3 h-3" /> {treesPlanted}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-1.5 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Basuras Recicladas</span>
              <span className="text-xs font-bold text-cyan-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> {trashRecycled}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-1.5 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Monedas Supremas</span>
              <span className="text-xs font-bold text-amber-300">⭐ {economy.coinsSuprema}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>* Sube de nivel para ascender tu rango oficial y desbloquear sellos.</span>
          <button
            onClick={() => {
              soundEngine.play7_MiMotivacion();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
