import { useEffect, useRef, useState } from 'react';
import { BINS, EXTRA_LABEL, type LevelConfig } from '../data/gameData';
import { Engine, H, W, type GameResult, type Hud, type Upgrades } from '../game/engine';
import { sound } from '../utils/audio';
import type { Avatar } from '../utils/storage';

interface Props {
  level: LevelConfig;
  avatar: Avatar;
  upgrades: Upgrades;
  hasDragon: boolean;
  showTutorial: boolean;
  onTutorialSeen: () => void;
  onFinish: (r: GameResult) => void;
  onExit: () => void;
}

const isTouch = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);

export function GameScreen(props: Props) {
  const { level } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const [attempt, setAttempt] = useState(0);
  const [hud, setHud] = useState<Hud | null>(null);
  const [phase, setPhase] = useState<'intro' | 'play' | 'pause'>('intro');
  const [toast, setToast] = useState<{ text: string; tone: 'good' | 'bad' | 'info'; id: number } | null>(null);
  const [touch] = useState(isTouch);

  // Crear el motor (una vez por nivel / reintento)
  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const p = propsRef.current;
    let toastTimer = 0;

    const engine = new Engine(p.level, p.avatar, p.upgrades, p.hasDragon, dpr, {
      onHud: setHud,
      onMessage: (text, tone) => {
        setToast({ text, tone, id: Math.random() });
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => setToast(null), 2600);
      },
      onEnd: r => {
        window.setTimeout(() => propsRef.current.onFinish(r), 700);
      },
    });
    engineRef.current = engine;
    setPhase('intro');
    setToast(null);

    let raf = 0;
    let last = performance.now();
    let drewPaused = false;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!engine.paused) {
        engine.update(dt);
        engine.draw(ctx);
        drewPaused = false;
      } else if (!drewPaused) {
        engine.draw(ctx);
        drewPaused = true;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(toastTimer);
      engineRef.current = null;
    };
  }, [level.number, attempt]);

  // Teclado
  useEffect(() => {
    const map: Record<string, 'up' | 'down' | 'left' | 'right' | 'fire'> = {
      arrowup: 'up', w: 'up',
      arrowdown: 'down', s: 'down',
      arrowleft: 'left', a: 'left',
      arrowright: 'right', d: 'right',
      ' ': 'fire', j: 'fire', enter: 'fire',
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const eng = engineRef.current;
      if (!eng) return;
      if (k === 'p' || k === 'escape') {
        e.preventDefault();
        setPhase(ph => {
          if (ph === 'play') { eng.paused = true; return 'pause'; }
          if (ph === 'pause') { eng.paused = false; return 'play'; }
          return ph;
        });
        return;
      }
      const action = map[k];
      if (action) {
        e.preventDefault();
        eng.input[action] = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      const action = map[e.key.toLowerCase()];
      const eng = engineRef.current;
      if (action && eng) eng.input[action] = false;
    };
    const clear = () => {
      const eng = engineRef.current;
      if (!eng) return;
      Object.assign(eng.input, { up: false, down: false, left: false, right: false, fire: false, joyX: 0, joyY: 0 });
    };
    // Pausa automática si el niño cambia de pestaña o minimiza
    const vis = () => {
      clear();
      const eng = engineRef.current;
      if (document.hidden && eng && !eng.paused) {
        eng.paused = true;
        setPhase(ph => (ph === 'play' ? 'pause' : ph));
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  const start = () => {
    sound.unlock();
    sound.click();
    if (props.showTutorial) props.onTutorialSeen();
    const eng = engineRef.current;
    if (eng) eng.paused = false;
    setPhase('play');
  };

  const pause = () => {
    sound.click();
    const eng = engineRef.current;
    if (eng) eng.paused = true;
    setPhase('pause');
  };

  const restart = () => {
    sound.click();
    setAttempt(a => a + 1);
  };

  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const eng = engineRef.current;
    if (!eng || phase !== 'play') return;
    const r = e.currentTarget.getBoundingClientRect();
    eng.setTarget(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
  };

  const timePct = hud ? (hud.time / hud.totalTime) * 100 : 100;
  const lowTime = hud ? hud.time <= 15 : false;
  const extra = EXTRA_LABEL[level.extra];

  const canvas = (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        onPointerDown={onCanvasPointer}
        className="block w-full h-auto rounded-3xl border-4 border-white shadow-xl touch-none bg-sky-300"
        style={{ aspectRatio: `${W} / ${H}` }}
        aria-label={`Nivel ${level.number}: ${level.title}`}
      />

      {toast && phase === 'play' && (
        <div
          key={toast.id}
          className={`toast-in absolute top-3 left-1/2 -translate-x-1/2 max-w-[92%] px-4 py-2 rounded-2xl text-sm sm:text-lg font-semibold shadow-lg text-center pointer-events-none border-2 ${
            toast.tone === 'good'
              ? 'bg-green-100 text-green-800 border-green-400'
              : toast.tone === 'bad'
              ? 'bg-orange-100 text-orange-800 border-orange-400'
              : 'bg-white text-slate-800 border-sky-300'
          }`}
        >
          {toast.text}
        </div>
      )}

      {phase === 'intro' && (
        <Overlay>
          <div className="text-6xl mb-2">{level.emoji}</div>
          <p className="text-sky-600 font-semibold">Nivel {level.number} · {level.place}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">{level.title}</h2>
          <p className="text-lg sm:text-xl text-slate-700 mb-4">{level.intro}</p>
          <Goals level={level} />
          {props.showTutorial && <Tutorial touch={touch} />}
          <button onClick={start} className="btn-big bg-green-500 hover:bg-green-400 text-white mt-4 w-full sm:w-auto">
            ▶ ¡A JUGAR!
          </button>
        </Overlay>
      )}

      {phase === 'pause' && (
        <Overlay>
          <div className="text-6xl mb-2">⏸️</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Juego en pausa</h2>
          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <button onClick={start} className="btn-big bg-green-500 hover:bg-green-400 text-white">▶ Seguir jugando</button>
            <button onClick={restart} className="btn-big bg-amber-400 hover:bg-amber-300 text-slate-900">🔄 Empezar de nuevo</button>
            <button onClick={() => { sound.click(); props.onExit(); }} className="btn-big bg-sky-500 hover:bg-sky-400 text-white">🗺️ Volver al mapa</button>
          </div>
        </Overlay>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-2 sm:gap-3">
      {/* HUD */}
      <div className="flex flex-wrap items-center gap-2 bg-white/90 rounded-3xl p-2 sm:p-3 shadow-md border-2 border-white">
        <button
          onClick={phase === 'play' ? pause : undefined}
          disabled={phase !== 'play'}
          className="w-12 h-12 rounded-2xl bg-sky-500 text-white text-2xl font-bold shadow active:scale-95 disabled:opacity-50"
          aria-label="Pausa"
        >
          ⏸
        </button>

        <div className="flex-1 min-w-[140px]">
          <div className="flex justify-between text-sm sm:text-base font-semibold text-slate-700">
            <span>⏱️ Tiempo</span>
            <span className={lowTime ? 'text-red-600 animate-pulse' : ''}>
              {hud ? `${Math.floor(hud.time / 60)}:${String(hud.time % 60).padStart(2, '0')}` : '--'}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${lowTime ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${timePct}%` }}
            />
          </div>
        </div>

        <Chip icon="♻️" label="Reciclar" value={`${hud?.sorted ?? 0}/${level.sortGoal}`} done={!!hud && hud.sorted >= level.sortGoal} />
        {level.extra !== 'sort' && level.extra !== 'befriend' && (
          <Chip
            icon={extra.icon}
            label={extra.text}
            value={level.extra === 'egg' ? `${hud?.extraDone ?? 0}/${level.extraGoal} + 🥚` : `${hud?.extraDone ?? 0}/${level.extraGoal}`}
            done={!!hud && hud.extraDone >= level.extraGoal}
          />
        )}
        <Chip
          icon={level.villain.icon}
          label={level.extra === 'befriend' ? 'Calma al villano' : level.villain.name}
          value={hud?.villainFriend ? '💚' : `${'🖤'.repeat(Math.min(hud?.villainHp ?? level.villain.hp, 6))}${(hud?.villainHp ?? 0) > 6 ? '+' : ''}`}
          done={!!hud?.villainFriend}
        />
        <Chip icon="🪙" label="Monedas" value={`+${hud?.coins ?? 0}`} />
      </div>

      {/* Zona de juego */}
      {touch ? (
        <div className="flex flex-col landscape:flex-row items-center gap-2">
          <div className="hidden landscape:block shrink-0"><Joystick engineRef={engineRef} /></div>
          <div className="w-full landscape:max-w-[calc((100dvh-110px)*1.6)]">{canvas}</div>
          <div className="hidden landscape:block shrink-0"><FireButton engineRef={engineRef} /></div>
          <div className="flex landscape:hidden w-full justify-between items-center px-2">
            <Joystick engineRef={engineRef} />
            <CarryCard hud={hud} level={level} />
            <FireButton engineRef={engineRef} />
          </div>
        </div>
      ) : (
        <>
          <div className="w-full max-w-[calc((100dvh-190px)*1.6)] min-w-[320px] mx-auto">{canvas}</div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base text-slate-700">
            <Key>⬆️⬇️⬅️➡️</Key> o <Key>W A S D</Key> moverte
            <span className="mx-1">·</span>
            <Key>ESPACIO</Key> agua 💦
            <span className="mx-1">·</span>
            <Key>P</Key> pausa
            <span className="mx-1">·</span>
            🖱️ clic para caminar
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 rounded-3xl bg-sky-900/40 flex items-center justify-center p-3 overflow-auto">
      <div className="pop-in bg-white rounded-3xl p-5 sm:p-7 text-center max-w-lg w-full shadow-2xl border-4 border-yellow-300 max-h-full overflow-auto">
        {children}
      </div>
    </div>
  );
}

function Goals({ level }: { level: LevelConfig }) {
  const e = EXTRA_LABEL[level.extra];
  return (
    <div className="flex flex-wrap justify-center gap-2 text-base sm:text-lg">
      <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">♻️ Recicla {level.sortGoal}</span>
      {level.extra !== 'sort' && (
        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold">
          {e.icon} {e.text} {level.extra !== 'befriend' ? level.extraGoal : ''}
          {level.extra === 'egg' ? ' + 🥚' : ''}
        </span>
      )}
      <div className="w-full flex flex-wrap justify-center gap-1 mt-1">
        {level.bins.map(b => (
          <span key={b} className="text-sm px-2 py-1 rounded-xl border-2 font-semibold" style={{ borderColor: BINS[b].dark, background: BINS[b].color, color: b === 'blanca' ? '#0f172a' : '#fff' }}>
            {BINS[b].icon} {BINS[b].short}
          </span>
        ))}
      </div>
    </div>
  );
}

function Tutorial({ touch }: { touch: boolean }) {
  return (
    <div className="mt-4 text-left bg-sky-50 rounded-2xl p-3 text-base sm:text-lg text-slate-700 space-y-1 border-2 border-sky-200">
      <p className="font-bold text-sky-700">¿Cómo se juega?</p>
      <p>1️⃣ {touch ? 'Mueve el joystick 🕹️ o toca la pantalla' : 'Muévete con las flechas ⬆️⬇️⬅️➡️ o haz clic'} para caminar.</p>
      <p>2️⃣ Pasa encima de una basura para recogerla.</p>
      <p>3️⃣ Llévala a la caneca de su color. ¡Te ayudaremos con una flecha ⬇️!</p>
      <p>4️⃣ {touch ? 'Toca el botón 💦' : 'Presiona ESPACIO'} para mojar al villano y calmarlo.</p>
    </div>
  );
}

function Chip({ icon, label, value, done }: { icon: string; label: string; value: string; done?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 ${done ? 'bg-green-100 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
      <span className="text-2xl leading-none">{icon}</span>
      <div className="leading-tight">
        <div className="text-[11px] sm:text-xs text-slate-500 font-semibold">{label}</div>
        <div className="text-base sm:text-lg font-bold text-slate-800">{done ? '✅' : ''} {value}</div>
      </div>
    </div>
  );
}

function CarryCard({ hud, level }: { hud: Hud | null; level: LevelConfig }) {
  const c = hud?.carrying;
  if (!c) return <div className="text-slate-500 text-sm text-center px-2">Recoge basura 🫳</div>;
  return (
    <div className="text-center px-2">
      <div className="text-3xl">{c.icon}{c.count > 1 ? ` x${c.count}` : ''}</div>
      <div className="text-xs font-semibold text-slate-700">{c.name}</div>
      {level.number <= 3 && <div className="text-xs font-bold" style={{ color: BINS[c.bin].dark }}>→ {BINS[c.bin].name}</div>}
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return <kbd className="px-2 py-0.5 rounded-lg bg-white border-2 border-slate-300 font-semibold shadow-sm">{children}</kbd>;
}

// ---------------------------------------------------------------------------
// Controles táctiles
// ---------------------------------------------------------------------------
function Joystick({ engineRef }: { engineRef: React.RefObject<Engine | null> }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  const R = 46;

  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    const eng = engineRef.current;
    if (eng) {
      const nx = dx / R;
      const ny = dy / R;
      const mag = Math.hypot(nx, ny);
      eng.input.joyX = mag < 0.18 ? 0 : nx;
      eng.input.joyY = mag < 0.18 ? 0 : ny;
    }
  };
  const end = () => {
    setKnob({ x: 0, y: 0 });
    const eng = engineRef.current;
    if (eng) {
      eng.input.joyX = 0;
      eng.input.joyY = 0;
    }
  };

  return (
    <div
      ref={base}
      className="relative w-32 h-32 rounded-full bg-white/70 border-4 border-sky-300 shadow-inner touch-none select-none"
      onPointerDown={e => {
        sound.unlock();
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={e => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Joystick para moverte"
    >
      <div
        className="absolute left-1/2 top-1/2 w-14 h-14 -ml-7 -mt-7 rounded-full bg-sky-500 border-4 border-white shadow-lg"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}

function FireButton({ engineRef }: { engineRef: React.RefObject<Engine | null> }) {
  const [pressed, setPressed] = useState(false);
  const set = (v: boolean) => {
    setPressed(v);
    const eng = engineRef.current;
    if (eng) eng.input.fire = v;
  };
  return (
    <button
      className={`w-28 h-28 rounded-full text-5xl border-4 border-white shadow-xl touch-none select-none transition-transform ${
        pressed ? 'bg-sky-600 scale-90' : 'bg-sky-400'
      }`}
      onPointerDown={e => {
        sound.unlock();
        e.currentTarget.setPointerCapture(e.pointerId);
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onContextMenu={e => e.preventDefault()}
      aria-label="Disparar agua"
    >
      💦
    </button>
  );
}
