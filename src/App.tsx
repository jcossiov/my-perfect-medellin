import React, { useState, useEffect, useCallback } from 'react';
import {
  PlayerAvatar,
  PlayerEconomy,
  DragonPet,
  House,
  ClanMember,
  Job,
  ShopItem,
  NPCDialog,
} from './types/game';
import {
  LEVELS,
  INITIAL_HOUSES,
  INITIAL_CLAN_MEMBERS,
  INITIAL_JOBS,
  SHOP_ITEMS,
  NPC_QUESTIONS,
} from './data/gameData';
import { soundEngine } from './utils/audio';
import { AudioControls } from './components/AudioControls';
import { KeyboardHUD } from './components/KeyboardHUD';
import { LevelCanvas } from './components/LevelCanvas';
import { LevelCanvas3D } from './components/LevelCanvas3D';
import { AvatarCreator } from './components/AvatarCreator';
import { CitizenCardModal } from './components/CitizenCardModal';
import { HouseModal } from './components/HouseModal';
import { CityMapModal } from './components/CityMapModal';
import { ClanModal } from './components/ClanModal';
import { DragonPetModal } from './components/DragonPetModal';
import { JobsModal } from './components/JobsModal';
import { ShopModal } from './components/ShopModal';
import { NPCModal } from './components/NPCModal';
import { ViralDanceCelebration } from './components/ViralDanceCelebration';
import { BlackHoleDefeat } from './components/BlackHoleDefeat';
import {
  User,
  ShieldCheck,
  Home,
  MapPin,
  Users,
  Flame,
  Briefcase,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  // 1. AVATAR STATE ("Crea tu Muñeco")
  const [avatar, setAvatar] = useState<PlayerAvatar>(() => {
    const saved = localStorage.getItem('medellin_avatar');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      gender: 'chico',
      name: 'Mateo',
      skinTone: '#e0ac69',
      hairStyle: 'corto',
      hairColor: '#4a2c11',
      outfit: 'paisa_tradicional',
      accessory: 'sombrero_vueltiao',
      auraColor: '#10b981',
      speed: 1,
    };
  });

  // 2. ECONOMY STATE (3 monedas, gemas, puntos, racha)
  const [economy, setEconomy] = useState<PlayerEconomy>(() => {
    const saved = localStorage.getItem('medellin_economy');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      coinsNormal: 150,
      coinsSuprema: 5,
      coinsImposible: 1,
      gems: 3,
      score: 0,
      streak: 0,
    };
  });

  // 3. STATS FOR CITIZEN ID
  const [treesPlanted, setTreesPlanted] = useState<number>(0);
  const [trashRecycled, setTrashRecycled] = useState<number>(0);

  // 4. LEVEL PROGRESSION (1 to 10)
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [unlockedLevelMax, setUnlockedLevelMax] = useState<number>(1);

  // 5. DRAGON PET (Unlocked from level 8!)
  const [dragon, setDragon] = useState<DragonPet>(() => {
    return {
      unlocked: false,
      hasEgg: false,
      isHatched: false,
      name: 'Draco Guayacán',
      type: 'esmeralda_arvi',
      stage: 'huevo',
      incubationTimeRemaining: 120, // 2 minutes
      hunger: 80,
      happiness: 90,
      level: 1,
      power: 25,
    };
  });

  // 6. HOUSES, CLAN, JOBS, SHOP, VISITED PLACES
  const [houses, setHouses] = useState<House[]>(INITIAL_HOUSES);
  const [activeHouseId, setActiveHouseId] = useState<string>('casa-1');
  const [clanName, setClanName] = useState<string>('Los Parceros Verdes');
  const [clanMembers, setClanMembers] = useState<ClanMember[]>(INITIAL_CLAN_MEMBERS);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [shopItems, setShopItems] = useState<ShopItem[]>(SHOP_ITEMS);
  const [visitedLocations, setVisitedLocations] = useState<string[]>([]);

  // 7. ACTIVE MODAL & 2D / 3D MODE
  const [activeModal, setActiveModal] = useState<
    null | 'avatar' | 'card' | 'house' | 'map' | 'clan' | 'dragon' | 'jobs' | 'shop' | 'npc'
  >(null);
  const [is3DMode, setIs3DMode] = useState<boolean>(false); // 2D fast mode default

  // 8. WIN & DEFEAT SCREENS
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [lastWinScore, setLastWinScore] = useState(0);
  const [showDefeatModal, setShowDefeatModal] = useState(false);
  const [defeatReason, setDefeatReason] = useState('');

  // 9. ACTIVE NPC DIALOG
  const [currentNPCIndex, setCurrentNPCIndex] = useState(0);

  // 10. CONTROLS STATE & SUPERPOWERS
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [superpowerActive, setSuperpowerActive] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('medellin_avatar', JSON.stringify(avatar));
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem('medellin_economy', JSON.stringify(economy));
  }, [economy]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture inputs inside text fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toLowerCase();

      // Prevent scrolling on space / arrows
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }

      setActiveKeys(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });

      // Quick Key Trigger: R to dance if win
      if (key === 'r' && showWinCelebration) {
        soundEngine.playViralDanceBeat();
      }

      // Quick Key Trigger: Q to activate Dragon / Superpower
      if (key === 'q') {
        if (dragon.unlocked && dragon.isHatched) {
          soundEngine.play7_MiMotivacion();
          setSuperpowerActive(true);
          setTimeout(() => setSuperpowerActive(false), 5000);
        } else {
          soundEngine.play3_ReSuspensoDivertido();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dragon, showWinCelebration]);

  // Dragon egg incubation countdown tick
  useEffect(() => {
    if (dragon.hasEgg && !dragon.isHatched) {
      const incTimer = setInterval(() => {
        setDragon(prev => {
          if (prev.incubationTimeRemaining <= 1) {
            soundEngine.play7_MiMotivacion();
            return {
              ...prev,
              isHatched: true,
              stage: 'bebe',
              incubationTimeRemaining: 0,
            };
          }
          return {
            ...prev,
            incubationTimeRemaining: prev.incubationTimeRemaining - 1,
          };
        });
      }, 1000);

      return () => clearInterval(incTimer);
    }
  }, [dragon.hasEgg, dragon.isHatched]);

  // Touch / On-screen action trigger
  const handleTriggerAction = (key: string) => {
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(key.toLowerCase());
      return next;
    });

    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(key.toLowerCase());
        return next;
      });
    }, 250);

    if (key === 'q' && dragon.unlocked && dragon.isHatched) {
      setSuperpowerActive(true);
      setTimeout(() => setSuperpowerActive(false), 5000);
    }
  };

  // Level Win Callback
  const handleWinLevel = useCallback((
    scoreGained: number,
    coinsNorm: number,
    coinsSup: number,
    coinsImp: number,
    gemsWon: number
  ) => {
    setLastWinScore(scoreGained);

    // If level 8 won, unlock Dragon Egg!
    if (currentLevelIndex + 1 === 8) {
      setDragon(prev => ({
        ...prev,
        unlocked: true,
        hasEgg: true,
        isHatched: false,
      }));
    }

    setEconomy(prev => {
      const newStreak = prev.streak + 1;
      let extraScore = 0;
      if (newStreak >= 3) {
        extraScore = 500;
      }
      return {
        ...prev,
        score: prev.score + scoreGained + extraScore,
        coinsNormal: prev.coinsNormal + coinsNorm,
        coinsSuprema: prev.coinsSuprema + coinsSup,
        coinsImposible: prev.coinsImposible + coinsImp,
        gems: prev.gems + gemsWon,
        streak: newStreak >= 3 ? 0 : newStreak,
      };
    });

    const nextLevelNum = currentLevelIndex + 2;
    if (nextLevelNum > unlockedLevelMax && nextLevelNum <= 10) {
      setUnlockedLevelMax(nextLevelNum);
    }

    setShowWinCelebration(true);
  }, [currentLevelIndex, unlockedLevelMax]);

  // Level Defeat Callback (Fell in Black Hole of Trash)
  const handleLoseLevel = useCallback((reason: string) => {
    setDefeatReason(reason);
    setEconomy(prev => ({ ...prev, streak: 0 }));
    setShowDefeatModal(true);
  }, []);

  // Next level navigation
  const handleNextLevel = () => {
    setShowWinCelebration(false);
    if (currentLevelIndex < 9) {
      setCurrentLevelIndex(prev => prev + 1);
    }
  };

  // Restart level
  const handleRestartLevel = () => {
    setShowDefeatModal(false);
  };

  // House actions
  const handleSelectHouse = (id: string) => {
    setActiveHouseId(id);
  };

  const handleBuyHouse = (houseToBuy: House) => {
    setEconomy(prev => ({ ...prev, coinsNormal: prev.coinsNormal - houseToBuy.cost }));
    setHouses(prev =>
      prev.map(h => (h.id === houseToBuy.id ? { ...h, unlocked: true } : h))
    );
    setActiveHouseId(houseToBuy.id);
  };

  const handleBuyHouseUpgrade = (
    houseId: string,
    itemId: string,
    cost: number,
    coinType: string
  ) => {
    setEconomy(prev => {
      const next = { ...prev };
      if (coinType === 'coinsNormal') next.coinsNormal -= cost;
      if (coinType === 'coinsSuprema') next.coinsSuprema -= cost;
      if (coinType === 'coinsImposible') next.coinsImposible -= cost;
      return next;
    });

    setHouses(prev =>
      prev.map(h =>
        h.id === houseId
          ? {
              ...h,
              items: h.items.map(it => (it.id === itemId ? { ...it, purchased: true } : it)),
            }
          : h
      )
    );
  };

  // City Map reward claim
  const handleClaimLocationReward = (locId: string) => {
    setVisitedLocations(prev => [...prev, locId]);
    setEconomy(prev => ({
      ...prev,
      coinsNormal: prev.coinsNormal + 50,
      gems: prev.gems + 1,
    }));
  };

  // Clan actions
  const handleRecruitClanMember = (memberId: string, cost: number) => {
    setEconomy(prev => ({ ...prev, coinsNormal: prev.coinsNormal - cost }));
    setClanMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, isRecruited: true } : m))
    );
  };

  // Dragon actions
  const handleFeedDragon = () => {
    setDragon(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 20),
      power: prev.power + 5,
    }));
  };

  const handleHatchDragonWithGems = () => {
    setEconomy(prev => ({ ...prev, gems: Math.max(0, prev.gems - 2) }));
    setDragon(prev => ({
      ...prev,
      isHatched: true,
      stage: 'bebe',
      incubationTimeRemaining: 0,
    }));
  };

  const handleEvolveDragon = () => {
    setEconomy(prev => ({ ...prev, gems: Math.max(0, prev.gems - 3) }));
    setDragon(prev => ({
      ...prev,
      stage: prev.stage === 'bebe' ? 'juvenil' : 'titan',
      level: prev.level + 1,
      power: prev.power + 35,
    }));
  };

  // Jobs actions
  const handleWorkJob = (job: Job) => {
    setEconomy(prev => ({
      ...prev,
      coinsNormal: prev.coinsNormal + job.salaryNormal,
      coinsSuprema: prev.coinsSuprema + job.salarySuprema,
    }));
    setJobs(prev =>
      prev.map(j => (j.id === job.id ? { ...j, lastWorked: Math.floor(Date.now() / 1000) } : j))
    );
  };

  // Shop purchase
  const handleBuyShopItem = (item: ShopItem) => {
    setEconomy(prev => {
      const next = { ...prev };
      if (item.currency === 'coinsNormal') next.coinsNormal -= item.price;
      if (item.currency === 'coinsSuprema') next.coinsSuprema -= item.price;
      if (item.currency === 'coinsImposible') next.coinsImposible -= item.price;
      if (item.currency === 'gems') next.gems -= item.price;
      if (item.currency === 'score') next.score -= item.price;
      return next;
    });

    setShopItems(prev =>
      prev.map(it => (it.id === item.id ? { ...it, owned: true } : it))
    );

    // Apply immediate effects
    if (item.effect === 'speed_boost') {
      setAvatar(prev => ({ ...prev, speed: prev.speed + 0.6 }));
    }
    if (item.effect === 'hatch_speed' && dragon.hasEgg && !dragon.isHatched) {
      setDragon(prev => ({
        ...prev,
        incubationTimeRemaining: Math.max(0, prev.incubationTimeRemaining - 60),
      }));
    }
  };

  // NPC dialogue answers
  const handleNPCAnswer = (
    isCorrect: boolean,
    norm: number = 0,
    sup: number = 0,
    gemCount: number = 0
  ) => {
    if (isCorrect) {
      setEconomy(prev => ({
        ...prev,
        coinsNormal: prev.coinsNormal + norm,
        coinsSuprema: prev.coinsSuprema + sup,
        gems: prev.gems + gemCount,
        score: prev.score + 100,
      }));
    }
  };

  const currentLevelConfig = LEVELS[currentLevelIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40">
              🌺
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black font-fun tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                  My Perfect Medellín
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  Paisa Eco-Game
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                ¡Juego interactivo de conciencia cívica, cultura paisa y rescate ecológico!
              </p>
            </div>
          </div>

          {/* Economy Balances Bar (3 Coins, Gems, Score) */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs font-bold shadow-inner">
            <div className="flex items-center gap-1 text-amber-400" title="Moneda Normal (Cobre)">
              <span>🪙</span>
              <span>{economy.coinsNormal}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-200" title="Moneda Suprema (Plata/Oro)">
              <span>⭐</span>
              <span>{economy.coinsSuprema}</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-300" title="Moneda Imposible (Diamante místico)">
              <span>💎</span>
              <span>{economy.coinsImposible}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400" title="Gemas Ecológicas (Incuban Huevos)">
              <span>💠</span>
              <span>{economy.gems}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-400" title="Puntos Acumulados">
              <span>🎯</span>
              <span>{economy.score}</span>
            </div>
          </div>

          {/* Audio Controls with 10 Sound Effects Soundboard */}
          <AudioControls />
        </div>

        {/* Feature Navigation Toolbar */}
        <div className="max-w-7xl mx-auto px-4 py-2 border-t border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('avatar');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-slate-700 text-slate-200 font-bold transition"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Muñeco</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('house');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-slate-700 text-slate-200 font-bold transition"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Casa</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('map');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500/20 hover:border-sky-500/40 border border-slate-700 text-slate-200 font-bold transition"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>3. Ciudad</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('clan');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-500/20 hover:border-purple-500/40 border border-slate-700 text-slate-200 font-bold transition"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>4. Clan</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('card');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700 text-slate-200 font-bold transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>5. Carné ID</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('dragon');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 text-slate-200 font-bold transition"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>6. Mascota & Dragón</span>
              {currentLevelIndex + 1 >= 8 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('jobs');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700 text-slate-200 font-bold transition"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>7. Trabajos</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal('shop');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-slate-700 text-slate-200 font-bold transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stand Tienda</span>
            </button>

            {/* 3D / 2D Mode Switcher */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIs3DMode(!is3DMode);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition shadow-sm ${
                !is3DMode
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-600/20 border-emerald-400 text-emerald-300 shadow-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{!is3DMode ? '⚡ 2D RÁPIDO (SIN LAG)' : '🥽 3D EXPERIMENTAL'}</span>
            </button>
          </div>

          {/* Villano Status Tag */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-rose-300 font-bold bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 rounded-xl">
            <span className="animate-bounce">{currentLevelConfig.villainInfo.avatar}</span>
            <span>Villano: {currentLevelConfig.villainInfo.name}</span>
          </div>
        </div>
      </header>

      {/* Main Game Screen */}
      <main className="max-w-7xl mx-auto px-4 py-4 w-full flex-1 flex flex-col items-center justify-center space-y-4">
        {/* Level Selector Bar (10 Levels) */}
        <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900/70 border border-slate-800 rounded-2xl p-2 px-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (currentLevelIndex > 0) {
                  soundEngine.playClick();
                  setCurrentLevelIndex(prev => prev - 1);
                }
              }}
              disabled={currentLevelIndex === 0}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mx-1">
              10 Niveles Épicos:
            </span>
          </div>

          {/* Level Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {LEVELS.map((lvl, idx) => {
              const isCurrent = currentLevelIndex === idx;
              const isUnlocked = idx + 1 <= unlockedLevelMax;

              return (
                <button
                  key={lvl.number}
                  onClick={() => {
                    if (isUnlocked) {
                      soundEngine.playClick();
                      setCurrentLevelIndex(idx);
                    } else {
                      soundEngine.play8_MiMiedo();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-105'
                      : isUnlocked
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'bg-slate-900/60 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                  title={`${lvl.title}: ${lvl.backgroundName}`}
                >
                  <span>{lvl.number}</span>
                  {idx + 1 === 8 && <span className="text-[10px]">🥚</span>}
                  {idx + 1 === 10 && <span className="text-[10px]">👑</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (currentLevelIndex < 9 && currentLevelIndex + 2 <= unlockedLevelMax) {
                soundEngine.playClick();
                setCurrentLevelIndex(prev => prev + 1);
              }
            }}
            disabled={currentLevelIndex >= 9 || currentLevelIndex + 2 > unlockedLevelMax}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Level Canvas Game Arena (3D / 2D) */}
        {is3DMode ? (
          <LevelCanvas3D
            level={currentLevelConfig}
            avatar={avatar}
            economy={economy}
            dragon={dragon}
            onWinLevel={handleWinLevel}
            onLoseLevel={handleLoseLevel}
            onUpdateTrashRecycled={() => setTrashRecycled(prev => prev + 1)}
            onUpdateTreesPlanted={() => setTreesPlanted(prev => prev + 1)}
            onTriggerNPC={() => {
              const nextIdx = (currentNPCIndex + 1) % NPC_QUESTIONS.length;
              setCurrentNPCIndex(nextIdx);
              setActiveModal('npc');
            }}
            activeKeys={activeKeys}
            superpowerActive={superpowerActive}
          />
        ) : (
          <LevelCanvas
            level={currentLevelConfig}
            avatar={avatar}
            economy={economy}
            dragon={dragon}
            onWinLevel={handleWinLevel}
            onLoseLevel={handleLoseLevel}
            onUpdateTrashRecycled={() => setTrashRecycled(prev => prev + 1)}
            onUpdateTreesPlanted={() => setTreesPlanted(prev => prev + 1)}
            onTriggerNPC={() => {
              const nextIdx = (currentNPCIndex + 1) % NPC_QUESTIONS.length;
              setCurrentNPCIndex(nextIdx);
              setActiveModal('npc');
            }}
            activeKeys={activeKeys}
            superpowerActive={superpowerActive}
          />
        )}

        {/* Keyboard HUD Indicator & Touch Action Buttons */}
        <div className="w-full max-w-5xl">
          <KeyboardHUD
            activeKeys={activeKeys}
            onTriggerAction={handleTriggerAction}
            canDance={showWinCelebration}
            powerActive={superpowerActive}
          />
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'avatar' && (
        <AvatarCreator
          avatar={avatar}
          onUpdateAvatar={setAvatar}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'card' && (
        <CitizenCardModal
          avatar={avatar}
          economy={economy}
          currentLevel={currentLevelIndex + 1}
          treesPlanted={treesPlanted}
          trashRecycled={trashRecycled}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'house' && (
        <HouseModal
          houses={houses}
          activeHouseId={activeHouseId}
          economy={economy}
          onSelectHouse={handleSelectHouse}
          onBuyHouse={handleBuyHouse}
          onBuyUpgrade={handleBuyHouseUpgrade}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'map' && (
        <CityMapModal
          visitedLocations={visitedLocations}
          onClaimLocationReward={handleClaimLocationReward}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'clan' && (
        <ClanModal
          clanName={clanName}
          onUpdateClanName={setClanName}
          clanMembers={clanMembers}
          currentLevel={currentLevelIndex + 1}
          economy={economy}
          onRecruitMember={handleRecruitClanMember}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'dragon' && (
        <DragonPetModal
          dragon={dragon}
          currentLevel={currentLevelIndex + 1}
          economy={economy}
          onFeedPet={handleFeedDragon}
          onHatchWithGems={handleHatchDragonWithGems}
          onEvolvePet={handleEvolveDragon}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'jobs' && (
        <JobsModal
          jobs={jobs}
          currentLevel={currentLevelIndex + 1}
          economy={economy}
          onWorkJob={handleWorkJob}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'shop' && (
        <ShopModal
          items={shopItems}
          economy={economy}
          onBuyItem={handleBuyShopItem}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'npc' && (
        <NPCModal
          dialog={NPC_QUESTIONS[currentNPCIndex]}
          onAnswer={handleNPCAnswer}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Victory Celebration Modal */}
      {showWinCelebration && (
        <ViralDanceCelebration
          levelNumber={currentLevelIndex + 1}
          avatar={avatar}
          scoreGained={lastWinScore}
          streak={economy.streak}
          onNextLevel={handleNextLevel}
        />
      )}

      {/* Defeat in Black Hole of Trash Modal */}
      {showDefeatModal && (
        <BlackHoleDefeat
          avatar={avatar}
          levelNumber={currentLevelIndex + 1}
          reason={defeatReason}
          onRestartLevel={handleRestartLevel}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        <p>My Perfect Medellín © • Cultura Paisa, Conciencia Ciudadana y Cuidado Ambiental para Niños y Jóvenes</p>
      </footer>
    </div>
  );
}
