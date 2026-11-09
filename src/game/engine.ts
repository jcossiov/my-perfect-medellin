import { BINS, TRASH, type BinType, type LevelConfig, type TrashKind } from '../data/gameData';
import type { Avatar } from '../utils/storage';
import { sound } from '../utils/audio';
import { drawEmoji, drawHero } from './sprites';

// ---------------------------------------------------------------------------
// Motor del juego: lógica + dibujo en canvas, SIN React.
// React solo recibe un resumen (HUD) cuando algo cambia, así no hay re-renders
// en cada frame (esa era la causa principal del lag en la versión anterior).
// ---------------------------------------------------------------------------

export const W = 960;
export const H = 600;
const PLAY_TOP = 90;
const PLAY_BOTTOM = 455;
const BIN_Y = 528;
const BIN_W = 120;
const BIN_H = 92;

export interface Upgrades {
  speed: boolean;
  bag: boolean;
  gun: boolean;
  time: boolean;
  magnet: boolean;
}

export interface Hud {
  time: number;
  totalTime: number;
  sorted: number;
  sortGoal: number;
  extraDone: number;
  extraGoal: number;
  villainHp: number;
  villainMax: number;
  villainFriend: boolean;
  carrying: { icon: string; name: string; bin: BinType; count: number } | null;
  coins: number;
}

export interface GameResult {
  win: boolean;
  stars: number;
  coins: number;
  sorted: number;
  mistakes: number;
}

export interface EngineCallbacks {
  onHud: (h: Hud) => void;
  onMessage: (text: string, tone: 'good' | 'bad' | 'info') => void;
  onEnd: (r: GameResult) => void;
}

interface Trash {
  kind: TrashKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  pop: number;
}
interface Spot {
  x: number;
  y: number;
  done: boolean;
  grow: number;
}
interface Mover {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface Monster extends Mover {
  hp: number;
  friend: boolean;
  flash: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}
interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

export class Engine {
  input = { up: false, down: false, left: false, right: false, fire: false, joyX: 0, joyY: 0 };
  paused = true;
  private ended = false;
  private t = 0;

  private level: LevelConfig;
  private avatar: Avatar;
  private up: Upgrades;
  private hasDragon: boolean;
  private cb: EngineCallbacks;

  private bg: HTMLCanvasElement;
  private dpr: number;

  private time: number;
  private totalTime: number;
  private sorted = 0;
  private mistakes = 0;
  private coins = 0;
  private lastHudKey = '';
  private hudTimer = 0;
  private depositCool = 0;

  private player = { x: W / 2, y: 330, facing: 1, aimX: 1, aimY: 0, stun: 0, inv: 0, moving: false, cool: 0 };
  private target: { x: number; y: number } | null = null;
  private carry: TrashKind[] = [];
  private trash: Trash[] = [];
  private bins: { type: BinType; x: number }[] = [];
  private villain = { x: 150, y: 160, tx: 400, ty: 300, hp: 1, max: 1, stun: 0, friend: false, drop: 0, flash: 0 };
  private shots: (Mover & { life: number })[] = [];
  private spots: Spot[] = [];
  private monsters: Monster[] = [];
  private puffers: Mover[] = [];
  private egg = { visible: false, taken: false, x: W / 2, y: 260 };
  private dragon = { x: W / 2, y: 300 };
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private drifters: { e: string; x: number; y: number; v: number; s: number }[] = [];

  constructor(level: LevelConfig, avatar: Avatar, up: Upgrades, hasDragon: boolean, dpr: number, cb: EngineCallbacks) {
    this.level = level;
    this.avatar = avatar;
    this.up = up;
    this.hasDragon = hasDragon;
    this.cb = cb;
    this.dpr = dpr;
    this.totalTime = level.time + (up.time ? 20 : 0);
    this.time = this.totalTime;

    // Canecas repartidas a lo ancho
    const n = level.bins.length;
    const gap = W / n;
    this.bins = level.bins.map((type, i) => ({ type, x: gap * i + gap / 2 }));

    // Villano
    this.villain.hp = level.villain.hp;
    this.villain.max = level.villain.hp;
    this.villain.drop = level.villain.dropEvery * 0.6;

    // Basura inicial
    for (let i = 0; i < 4; i++) this.spawnTrash();

    // Objetivos especiales
    const spotLayouts: Record<string, [number, number][]> = {
      plant: [[130, 150], [300, 220], [480, 140], [660, 220], [830, 150], [220, 380], [740, 380]],
      filters: [[120, 130], [840, 130], [480, 210], [220, 390], [740, 390]],
      egg: [[120, 140], [840, 140], [300, 400], [660, 400], [480, 130]],
      nests: [[150, 170], [810, 170], [480, 140], [260, 390], [700, 390]],
    };
    if (spotLayouts[level.extra]) {
      this.spots = spotLayouts[level.extra]
        .slice(0, Math.max(level.extraGoal, 5))
        .map(([x, y]) => ({ x, y, done: false, grow: 0 }));
    }
    if (level.extra === 'monsters') {
      this.monsters = [
        { x: 200, y: 200, vx: 40, vy: 30, hp: 2, friend: false, flash: 0 },
        { x: 760, y: 200, vx: -35, vy: 35, hp: 2, friend: false, flash: 0 },
        { x: 480, y: 400, vx: 45, vy: -25, hp: 2, friend: false, flash: 0 },
      ];
    }
    if (level.extra === 'egg') {
      this.puffers = [
        { x: 250, y: 300, vx: 70, vy: 50 },
        { x: 700, y: 250, vx: -60, vy: 60 },
      ];
    }

    for (let i = 0; i < 3; i++) {
      this.drifters.push({
        e: level.decor[i % level.decor.length],
        x: rand(0, W),
        y: rand(PLAY_TOP + 10, PLAY_BOTTOM - 40),
        v: rand(12, 25) * (i % 2 ? -1 : 1),
        s: rand(22, 30),
      });
    }

    this.bg = this.renderBackground();
    this.emitHud(true);
  }

  // ------------------------------------------------------------------ fondo
  private renderBackground(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = W * this.dpr;
    c.height = H * this.dpr;
    const g = c.getContext('2d')!;
    g.scale(this.dpr, this.dpr);
    const L = this.level;

    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, L.sky[0]);
    sky.addColorStop(0.75, L.sky[1]);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // Montañas del Valle de Aburrá
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.beginPath();
    g.moveTo(0, 150);
    for (let x = 0; x <= W; x += 60) g.lineTo(x, 110 + Math.sin(x * 0.012) * 35 + Math.sin(x * 0.031) * 12);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath();
    g.moveTo(0, 200);
    for (let x = 0; x <= W; x += 50) g.lineTo(x, 170 + Math.cos(x * 0.01) * 30);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();

    // Decoración fija
    const spots: [number, number][] = [[40, 50], [920, 50], [480, 40], [270, 60], [700, 60]];
    L.decor.forEach((e, i) => {
      const [x, y] = spots[i % spots.length];
      drawEmoji(g, e, x, y, 34);
    });

    // Suelo para las canecas
    g.fillStyle = L.ground;
    g.beginPath();
    g.roundRect(0, PLAY_BOTTOM + 15, W, H - PLAY_BOTTOM, [28, 28, 0, 0]);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)';
    for (let x = 20; x < W; x += 60) {
      g.beginPath();
      g.arc(x, PLAY_BOTTOM + 30, 4, 0, Math.PI * 2);
      g.fill();
    }

    return c;
  }

  // ------------------------------------------------------------------ helpers
  private spawnTrash(x?: number, y?: number) {
    const allowed = TRASH.filter(k => this.level.bins.includes(k.bin));
    const kind = allowed[Math.floor(Math.random() * allowed.length)];
    const px = x ?? rand(70, W - 70);
    const py = y ?? rand(PLAY_TOP + 20, PLAY_BOTTOM - 20);
    // Evitar que aparezca encima del jugador
    const tooClose = x === undefined && dist(px, py, this.player.x, this.player.y) < 90;
    this.trash.push({
      kind,
      x: tooClose ? W - px : px,
      y: py,
      vx: x !== undefined ? rand(-160, 160) : 0,
      vy: x !== undefined ? rand(-160, 60) : 0,
      phase: Math.random() * 6,
      pop: x !== undefined ? 0 : 1,
    });
  }

  private burst(x: number, y: number, color: string, n = 10, speed = 160) {
    for (let i = 0; i < n && this.particles.length < 140; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(speed * 0.4, speed);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.7, max: 0.7, color, size: rand(3, 6) });
    }
  }

  private float(x: number, y: number, text: string, color = '#fde047') {
    if (this.texts.length < 12) this.texts.push({ x, y, text, color, life: 1.1 });
  }

  setTarget(x: number, y: number) {
    this.target = { x, y: Math.min(y, BIN_Y + 10) };
  }

  private extraDone(): number {
    switch (this.level.extra) {
      case 'befriend':
        return this.villain.friend ? 1 : 0;
      case 'monsters':
        return this.monsters.filter(m => m.friend).length;
      case 'plant':
      case 'filters':
      case 'nests':
      case 'egg':
        return this.spots.filter(s => s.done).length;
      default:
        return 0;
    }
  }

  private extraComplete(): boolean {
    const L = this.level;
    if (L.extra === 'sort') return true;
    if (L.extra === 'egg') return this.egg.taken;
    return this.extraDone() >= L.extraGoal;
  }

  private emitHud(force = false) {
    const c = this.carry[0];
    const h: Hud = {
      time: Math.ceil(this.time),
      totalTime: this.totalTime,
      sorted: this.sorted,
      sortGoal: this.level.sortGoal,
      extraDone: this.extraDone(),
      extraGoal: this.level.extraGoal,
      villainHp: Math.ceil(this.villain.hp),
      villainMax: this.villain.max,
      villainFriend: this.villain.friend,
      carrying: c ? { icon: c.icon, name: c.name, bin: c.bin, count: this.carry.length } : null,
      coins: this.coins,
    };
    const key = `${h.time}|${h.sorted}|${h.extraDone}|${h.villainHp}|${h.villainFriend}|${c?.icon}|${this.carry.length}|${h.coins}|${this.egg.taken}`;
    if (force || key !== this.lastHudKey) {
      this.lastHudKey = key;
      this.cb.onHud(h);
    }
  }

  private dropCarried() {
    if (!this.carry.length) return;
    this.carry.forEach(k => {
      this.trash.push({ kind: k, x: this.player.x, y: this.player.y, vx: rand(-200, 200), vy: rand(-220, -60), phase: 0, pop: 0 });
    });
    this.carry = [];
  }

  private hurtPlayer(fromX: number, fromY: number, msg: string) {
    const p = this.player;
    if (p.inv > 0) return;
    p.stun = 0.6;
    p.inv = 1.6;
    const a = Math.atan2(p.y - fromY, p.x - fromX);
    p.x += Math.cos(a) * 50;
    p.y += Math.sin(a) * 50;
    sound.bump();
    if (this.carry.length) {
      this.dropCarried();
      this.cb.onMessage(msg, 'bad');
    }
  }

  // ------------------------------------------------------------------ update
  update(dt: number) {
    if (this.paused || this.ended) return;
    this.t += dt;
    const L = this.level;
    const p = this.player;

    // Tiempo
    const prev = Math.ceil(this.time);
    this.time -= dt;
    if (Math.ceil(this.time) !== prev && this.time <= 10 && this.time > 0) sound.tick();
    if (this.time <= 0) {
      this.time = 0;
      this.finish(false);
      return;
    }

    // --- Movimiento del jugador
    let dx = 0;
    let dy = 0;
    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;
    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;
    if (this.input.joyX || this.input.joyY) {
      dx = this.input.joyX;
      dy = this.input.joyY;
    }
    if (dx || dy) {
      this.target = null;
    } else if (this.target) {
      const tx = this.target.x - p.x;
      const ty = this.target.y - p.y;
      const d = Math.hypot(tx, ty);
      if (d < 8) this.target = null;
      else {
        dx = tx / d;
        dy = ty / d;
      }
    }
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    const speed = 240 * (this.up.speed ? 1.3 : 1);
    p.moving = false;
    if (p.stun > 0) {
      p.stun -= dt;
    } else if (len > 0.1) {
      p.x += dx * speed * dt;
      p.y += dy * speed * dt;
      p.moving = true;
      if (Math.abs(dx) > 0.2) p.facing = dx > 0 ? 1 : -1;
      const l = Math.hypot(dx, dy);
      p.aimX = dx / l;
      p.aimY = dy / l;
    }
    if (p.inv > 0) p.inv -= dt;
    p.x = Math.max(30, Math.min(W - 30, p.x));
    p.y = Math.max(PLAY_TOP, Math.min(BIN_Y + 10, p.y));

    // --- Disparo de agua
    p.cool -= dt;
    if (this.input.fire && p.cool <= 0) this.fire();

    // --- Basura: física de "salto", imán y recoger
    const cap = this.up.bag ? 3 : 1;
    const magnet = this.up.magnet || this.hasDragon;
    for (let i = this.trash.length - 1; i >= 0; i--) {
      const tr = this.trash[i];
      if (tr.pop < 1) {
        tr.pop = Math.min(1, tr.pop + dt * 2.2);
        tr.x += tr.vx * dt;
        tr.y += tr.vy * dt;
        tr.vy += 420 * dt;
        tr.x = Math.max(40, Math.min(W - 40, tr.x));
        tr.y = Math.max(PLAY_TOP, Math.min(PLAY_BOTTOM - 10, tr.y));
        continue;
      }
      const d = dist(tr.x, tr.y, p.x, p.y);
      const canTake = this.carry.length === 0 || (this.carry.length < cap && this.carry[0].bin === tr.kind.bin);
      if (magnet && canTake && d < 160 && d > 1) {
        tr.x += ((p.x - tr.x) / d) * 170 * dt;
        tr.y += ((p.y - tr.y) / d) * 170 * dt;
      }
      if (canTake && d < 40 && p.stun <= 0) {
        this.carry.push(tr.kind);
        this.trash.splice(i, 1);
        sound.pickup();
        const b = BINS[tr.kind.bin];
        if (L.number <= 3) this.cb.onMessage(`${tr.kind.icon} ${tr.kind.name} → ${b.name}`, 'info');
        else this.cb.onMessage(`${tr.kind.icon} ${tr.kind.name}: ¿a qué caneca va?`, 'info');
      }
    }

    // --- Depositar en caneca
    if (this.depositCool > 0) this.depositCool -= dt;
    if (this.carry.length && this.depositCool <= 0 && p.y > BIN_Y - BIN_H / 2 - 10) {
      for (const bin of this.bins) {
        if (Math.abs(p.x - bin.x) < BIN_W / 2) {
          this.deposit(bin.type, bin.x);
          break;
        }
      }
    }

    // Mantener siempre algo de basura en pantalla (ni muy poca ni saturado)
    if (this.trash.length + this.carry.length < 3) this.spawnTrash();

    // --- Disparos
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      let hit = false;
      const v = this.villain;
      if (!v.friend && dist(s.x, s.y, v.x, v.y) < 48) {
        hit = true;
        v.hp -= this.up.gun ? 1.5 : 1;
        v.stun = 1.2;
        v.flash = 0.25;
        sound.hit();
        this.burst(s.x, s.y, '#38bdf8', 8);
        if (v.hp <= 0) {
          v.hp = 0;
          v.friend = true;
          sound.magic();
          this.burst(v.x, v.y, '#4ade80', 24, 240);
          this.float(v.x, v.y - 50, '¡Amigo! 💚', '#4ade80');
          this.cb.onMessage(`¡${L.villain.name} ahora es tu amigo y ya no ensucia! 💚`, 'good');
        }
      }
      if (!hit) {
        for (const m of this.monsters) {
          if (!m.friend && dist(s.x, s.y, m.x, m.y) < 36) {
            hit = true;
            m.hp -= 1;
            m.flash = 0.25;
            sound.hit();
            this.burst(s.x, s.y, '#38bdf8', 6);
            if (m.hp <= 0) {
              m.friend = true;
              sound.magic();
              this.float(m.x, m.y - 30, '💚', '#4ade80');
              this.cb.onMessage('¡Monstruo limpio! Ahora es tu amigo 🐸', 'good');
            }
            break;
          }
        }
      }
      if (hit || s.life <= 0 || s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) this.shots.splice(i, 1);
    }

    // --- Villano
    const v = this.villain;
    if (v.flash > 0) v.flash -= dt;
    if (v.stun > 0) v.stun -= dt;
    else {
      const vs = v.friend ? 40 : L.villain.speed;
      const d = dist(v.x, v.y, v.tx, v.ty);
      if (d < 20) {
        v.tx = rand(90, W - 90);
        v.ty = rand(PLAY_TOP + 20, PLAY_BOTTOM - 30);
      } else {
        v.x += ((v.tx - v.x) / d) * vs * dt;
        v.y += ((v.ty - v.y) / d) * vs * dt;
      }
      if (!v.friend) {
        v.drop -= dt;
        if (v.drop <= 0) {
          v.drop = L.villain.dropEvery;
          if (this.trash.length < 7) {
            this.spawnTrash(v.x, v.y);
            sound.drop();
          }
        }
        if (dist(v.x, v.y, p.x, p.y) < 50) this.hurtPlayer(v.x, v.y, '¡Auch! El villano te hizo soltar la basura. ¡Mójalo! 💦');
      }
    }

    // --- Monstruos (nivel 4)
    for (const m of this.monsters) {
      if (m.flash > 0) m.flash -= dt;
      const sp = m.friend ? 0.4 : 1;
      m.x += m.vx * sp * dt;
      m.y += m.vy * sp * dt;
      if (m.x < 60 || m.x > W - 60) m.vx *= -1;
      if (m.y < PLAY_TOP + 10 || m.y > PLAY_BOTTOM - 20) m.vy *= -1;
    }

    // --- Peces globo (nivel 8)
    for (const f of this.puffers) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x < 50 || f.x > W - 50) f.vx *= -1;
      if (f.y < PLAY_TOP || f.y > PLAY_BOTTOM - 20) f.vy *= -1;
      if (dist(f.x, f.y, p.x, p.y) < 38) this.hurtPlayer(f.x, f.y, '¡Un pez globo! Se te cayó la basura 🐡');
    }

    // --- Lugares especiales (sembrar, filtros, barriles, nidos)
    for (const s of this.spots) {
      if (s.done) {
        if (s.grow < 1) s.grow = Math.min(1, s.grow + dt * 2);
        continue;
      }
      if (dist(s.x, s.y, p.x, p.y) < 42) {
        s.done = true;
        sound.magic();
        this.burst(s.x, s.y, '#fde047', 14);
        this.coins += 3;
        this.float(s.x, s.y - 30, '+3 🪙');
        const msgs: Record<string, string> = {
          plant: '¡Sembraste un árbol! 🌳',
          filters: '¡Filtro de aire activado! 🌀',
          egg: '¡Barril tapado! 🛢️✅',
          nests: '¡Nido protegido! ☂️',
        };
        this.cb.onMessage(msgs[L.extra] ?? '¡Bien!', 'good');
        if (L.extra === 'egg' && this.spots.every(sp => sp.done) && !this.egg.visible) {
          this.egg.visible = true;
          sound.win();
          this.burst(this.egg.x, this.egg.y, '#f0abfc', 30, 260);
          this.cb.onMessage('¡Apareció un HUEVO MÁGICO! 🥚✨ ¡Ve por él!', 'good');
        }
      }
    }
    if (this.egg.visible && !this.egg.taken && dist(this.egg.x, this.egg.y, p.x, p.y) < 44) {
      this.egg.taken = true;
      sound.magic();
      this.burst(this.egg.x, this.egg.y, '#f0abfc', 30, 260);
      this.cb.onMessage('¡Tienes el huevo de dragón! 🥚💜', 'good');
    }

    // --- Mascota dragón
    if (this.hasDragon) {
      const tx = p.x - p.facing * 46;
      const ty = p.y - 46;
      this.dragon.x += (tx - this.dragon.x) * Math.min(1, dt * 4);
      this.dragon.y += (ty - this.dragon.y) * Math.min(1, dt * 4);
    }

    // --- Decoración que flota
    for (const d of this.drifters) {
      d.x += d.v * dt;
      if (d.x > W + 30) d.x = -30;
      if (d.x < -30) d.x = W + 30;
    }

    // --- Partículas y textos
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 300 * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const ft = this.texts[i];
      ft.life -= dt;
      ft.y -= 40 * dt;
      if (ft.life <= 0) this.texts.splice(i, 1);
    }

    // --- ¿Ganó?
    if (this.sorted >= L.sortGoal && this.extraComplete()) {
      this.finish(true);
      return;
    }

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
  }

  private fire() {
    const p = this.player;
    p.cool = this.up.gun ? 0.18 : 0.32;
    // Apuntado automático suave: si hay un enemigo cerca, el chorro va hacia él.
    let ax = p.aimX;
    let ay = p.aimY;
    let best = 400;
    const consider = (x: number, y: number) => {
      const d = dist(x, y, p.x, p.y);
      if (d < best) {
        best = d;
        ax = (x - p.x) / d;
        ay = (y - p.y) / d;
      }
    };
    if (!this.villain.friend) consider(this.villain.x, this.villain.y);
    this.monsters.forEach(m => !m.friend && consider(m.x, m.y));
    if (ax === 0 && ay === 0) ax = p.facing;
    if (Math.abs(ax) > 0.2) p.facing = ax > 0 ? 1 : -1;
    this.shots.push({ x: p.x + ax * 20, y: p.y - 4 + ay * 20, vx: ax * 560, vy: ay * 560, life: 0.9 });
    sound.splash();
  }

  private deposit(type: BinType, bx: number) {
    const L = this.level;
    const p = this.player;
    const n = this.carry.length;
    const k = this.carry[0];
    if (k.bin === type) {
      this.sorted += n;
      const earned = 5 * n;
      this.coins += earned;
      sound.correct();
      sound.coin();
      this.burst(bx, BIN_Y - 40, BINS[type].color === '#f8fafc' ? '#38bdf8' : BINS[type].color, 16, 200);
      this.float(bx, BIN_Y - 70, `+${earned} 🪙`);
      const left = Math.max(0, L.sortGoal - this.sorted);
      this.cb.onMessage(
        left > 0 ? `¡Muy bien! ${k.icon} va en la ${BINS[type].name}. Faltan ${left}.` : '¡Reciclaje completo! ⭐',
        'good'
      );
      this.carry = [];
    } else {
      this.mistakes++;
      sound.wrong();
      this.cb.onMessage(`¡Ups! ${k.icon} ${k.name} va en la ${BINS[k.bin].name}. ¡Inténtalo otra vez!`, 'bad');
      this.float(bx, BIN_Y - 70, '✖', '#f87171');
      // Se queda cargando el objeto y lo empujamos hacia arriba para que pruebe otra caneca
      p.y = BIN_Y - BIN_H / 2 - 40;
      this.target = null;
      this.depositCool = 0.9;
    }
  }

  private finish(win: boolean) {
    if (this.ended) return;
    this.ended = true;
    this.emitHud(true);
    let stars = 0;
    if (win) {
      stars = 1;
      if (this.mistakes <= 2) stars++;
      if (this.time / this.totalTime >= 0.3) stars++;
      this.coins += 20 + this.level.number * 10 + stars * 10;
      sound.win();
    } else {
      sound.lose();
    }
    this.cb.onEnd({ win, stars, coins: this.coins, sorted: this.sorted, mistakes: this.mistakes });
  }

  // ------------------------------------------------------------------ draw
  draw(ctx: CanvasRenderingContext2D) {
    const t = this.t;
    const L = this.level;
    const p = this.player;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    for (const d of this.drifters) drawEmoji(ctx, d.e, d.x, d.y + Math.sin(t + d.x * 0.01) * 6, d.s);

    // Canecas
    const highlight = L.number <= 3 && this.carry[0] ? this.carry[0].bin : null;
    for (const bin of this.bins) this.drawBin(ctx, bin.type, bin.x, highlight === bin.type, t);

    // Lugares especiales
    for (const s of this.spots) this.drawSpot(ctx, s, t);

    // Huevo
    if (this.egg.visible && !this.egg.taken) {
      ctx.fillStyle = 'rgba(240,171,252,0.35)';
      ctx.beginPath();
      ctx.arc(this.egg.x, this.egg.y, 34 + Math.sin(t * 5) * 5, 0, Math.PI * 2);
      ctx.fill();
      drawEmoji(ctx, '🥚', this.egg.x, this.egg.y + Math.sin(t * 4) * 4, 44);
    }

    // Basura
    for (const tr of this.trash) {
      const bob = tr.pop >= 1 ? Math.sin(t * 3 + tr.phase) * 4 : 0;
      const near = dist(tr.x, tr.y, p.x, p.y) < 70;
      ctx.fillStyle = near ? 'rgba(253,224,71,0.9)' : 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(tr.x, tr.y + bob, near ? 25 : 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = BINS[tr.kind.bin].dark;
      ctx.lineWidth = 3;
      ctx.stroke();
      drawEmoji(ctx, tr.kind.icon, tr.x, tr.y + bob, 30, 0.6 + 0.4 * tr.pop);
    }

    // Monstruos
    for (const m of this.monsters) {
      const sc = m.flash > 0 ? 1.2 : 1;
      drawEmoji(ctx, m.friend ? '🐸' : '👾', m.x, m.y + Math.sin(t * 4 + m.x) * 4, 42, sc);
      if (m.friend) drawEmoji(ctx, '💚', m.x + 20, m.y - 24, 16);
    }

    // Peces globo
    for (const f of this.puffers) drawEmoji(ctx, '🐡', f.x, f.y, 38, 1 + Math.sin(t * 6) * 0.08);

    // Villano
    this.drawVillain(ctx, t);

    // Disparos
    ctx.fillStyle = '#38bdf8';
    for (const s of this.shots) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    for (const s of this.shots) {
      ctx.beginPath();
      ctx.arc(s.x - 2, s.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Marcador de destino al tocar
    if (this.target) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.target.x, this.target.y, 10 + Math.sin(t * 8) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Jugador (parpadea si es invulnerable)
    if (!(p.inv > 0 && Math.floor(t * 12) % 2 === 0)) {
      drawHero(ctx, this.avatar, p.x, p.y, 1.25, p.facing, t, p.moving);
    }
    if (p.stun > 0) drawEmoji(ctx, '💫', p.x, p.y - 62, 22);

    // Lo que lleva cargado
    if (this.carry.length) {
      const k = this.carry[0];
      const bx = p.x;
      const by = p.y - 78;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bx - 26, by - 22, 52, 44, 14);
      ctx.fill();
      ctx.strokeStyle = BINS[k.bin].dark;
      ctx.lineWidth = 3;
      ctx.stroke();
      drawEmoji(ctx, k.icon, bx, by, 28);
      if (this.carry.length > 1) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(bx + 24, by - 18, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(this.carry.length), bx + 24, by - 17);
      }
    }

    // Dragón
    if (this.hasDragon) drawEmoji(ctx, '🐲', this.dragon.x, this.dragon.y + Math.sin(t * 5) * 5, 34);

    // Partículas
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.life / pt.max;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // Textos flotantes
    if (this.texts.length) {
      ctx.font = 'bold 24px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      for (const ft of this.texts) {
        ctx.globalAlpha = Math.min(1, ft.life * 2);
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawBin(ctx: CanvasRenderingContext2D, type: BinType, x: number, hl: boolean, t: number) {
    const b = BINS[type];
    const y = BIN_Y;
    const w = BIN_W - 14;
    const h = BIN_H;
    if (hl) {
      ctx.fillStyle = `rgba(253,224,71,${0.45 + Math.sin(t * 8) * 0.2})`;
      ctx.beginPath();
      ctx.roundRect(x - w / 2 - 10, y - h / 2 - 22, w + 20, h + 32, 20);
      ctx.fill();
      drawEmoji(ctx, '⬇️', x, y - h / 2 - 34 + Math.sin(t * 8) * 5, 26);
    }
    // cuerpo
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(x - w / 2 + 6, y - h / 2 + 8, w - 12, h - 8, [4, 4, 16, 16]);
    ctx.fill();
    ctx.strokeStyle = b.dark;
    ctx.lineWidth = 3;
    ctx.stroke();
    // tapa
    ctx.fillStyle = b.dark;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2 - 4, w, 14, 7);
    ctx.fill();
    // icono
    drawEmoji(ctx, b.icon, x, y + 2, 28);
    // etiqueta
    ctx.font = 'bold 13px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = type === 'blanca' ? '#0f172a' : '#ffffff';
    ctx.fillText(b.short.toUpperCase(), x, y + h / 2 - 14);
  }

  private drawSpot(ctx: CanvasRenderingContext2D, s: Spot, t: number) {
    const L = this.level;
    const bob = Math.sin(t * 3 + s.x) * 3;
    if (L.extra === 'plant') {
      if (!s.done) {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y + 10, 26, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        drawEmoji(ctx, '🌱', s.x, s.y - 6 + bob, 22, 0.8);
      } else {
        drawEmoji(ctx, L.number === 6 ? '🌳' : '🌺', s.x, s.y - 10, 46, 0.3 + 0.7 * s.grow);
      }
    } else if (L.extra === 'filters') {
      ctx.fillStyle = s.done ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.done ? t * 4 : 0);
      drawEmoji(ctx, '🌀', 0, 0, 34);
      ctx.restore();
      if (s.done) drawEmoji(ctx, '✅', s.x + 22, s.y - 22, 18);
    } else if (L.extra === 'egg') {
      drawEmoji(ctx, s.done ? '✅' : '🛢️', s.x, s.y + (s.done ? 0 : bob), s.done ? 30 : 40);
      if (!s.done) drawEmoji(ctx, '☣️', s.x + 18, s.y - 20, 18);
    } else if (L.extra === 'nests') {
      drawEmoji(ctx, '🪺', s.x, s.y + 8, 40);
      if (s.done) drawEmoji(ctx, '☂️', s.x, s.y - 30, 40, 0.4 + 0.6 * s.grow);
      else drawEmoji(ctx, '🌧️', s.x, s.y - 36 + bob, 28);
    }
  }

  private drawVillain(ctx: CanvasRenderingContext2D, t: number) {
    const v = this.villain;
    const L = this.level;
    if (v.friend) {
      ctx.fillStyle = 'rgba(74,222,128,0.3)';
      ctx.beginPath();
      ctx.arc(v.x, v.y, 40, 0, Math.PI * 2);
      ctx.fill();
      drawEmoji(ctx, L.villain.icon, v.x, v.y + Math.sin(t * 3) * 3, 52);
      drawEmoji(ctx, '😊', v.x + 26, v.y - 28, 22);
      return;
    }
    ctx.fillStyle = `rgba(147,51,234,${0.25 + Math.sin(t * 6) * 0.08})`;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 46, 0, Math.PI * 2);
    ctx.fill();
    drawEmoji(ctx, L.villain.icon, v.x, v.y + Math.sin(t * 6) * 4, 60, v.flash > 0 ? 1.15 : 1);
    if (v.stun > 0) drawEmoji(ctx, '💦', v.x, v.y - 50, 22);

    // Barra de vida en corazones
    const n = Math.ceil(v.max);
    const filled = Math.ceil(v.hp);
    const size = n > 8 ? 12 : 16;
    const startX = v.x - ((n - 1) * size) / 2;
    for (let i = 0; i < n; i++) drawEmoji(ctx, i < filled ? '🖤' : '🤍', startX + i * size, v.y - 52, size - 2);
  }
}
