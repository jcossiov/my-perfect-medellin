import type { Avatar } from '../utils/storage';

// ---------------------------------------------------------------------------
// Caché de emojis: dibujar texto/emoji en canvas en cada frame es MUY lento.
// Aquí se dibujan una sola vez en un canvas pequeño y luego se copian con
// drawImage, que es rapidísimo (esto elimina la mayor fuente de lag).
// ---------------------------------------------------------------------------
const cache = new Map<string, HTMLCanvasElement>();
const RES = 2; // resolución extra para que se vea nítido en pantallas retina

export function emojiSprite(emoji: string, size: number): HTMLCanvasElement {
  const key = `${emoji}@${size}`;
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  const px = Math.ceil(size * RES * 1.25);
  c.width = px;
  c.height = px;
  const g = c.getContext('2d')!;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${size * RES}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.fillText(emoji, px / 2, px / 2 + size * RES * 0.06);
  cache.set(key, c);
  return c;
}

export function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  x: number,
  y: number,
  size: number,
  scale = 1
) {
  const s = emojiSprite(emoji, size);
  const d = size * 1.25 * scale;
  ctx.drawImage(s, x - d / 2, y - d / 2, d, d);
}

// ---------------------------------------------------------------------------
// Personaje (se usa en el juego y en la pantalla "Mi personaje").
// ---------------------------------------------------------------------------
const ACCESSORY_EMOJI: Record<string, string> = {
  sombrero: '👒',
  audifonos: '🎧',
  gafas: '🕶️',
  capa: '🦸',
  corona: '👑',
};

export function drawHero(
  ctx: CanvasRenderingContext2D,
  a: Avatar,
  x: number,
  y: number,
  scale: number,
  facing: number, // 1 derecha, -1 izquierda
  t: number,
  moving: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const step = moving ? Math.sin(t * 14) : 0;
  const bob = moving ? Math.abs(Math.sin(t * 14)) * 2 : Math.sin(t * 3) * 1;

  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 30, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -bob);

  // capa
  if (a.accessory === 'capa') {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(12, -4);
    ctx.lineTo(16 - facing * 6, 24 + step * 2);
    ctx.lineTo(-16 - facing * 6, 24 - step * 2);
    ctx.closePath();
    ctx.fill();
  }

  // piernas
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, 14);
  ctx.lineTo(-5 + step * 4, 27);
  ctx.moveTo(5, 14);
  ctx.lineTo(5 - step * 4, 27);
  ctx.stroke();

  // cuerpo (camiseta)
  ctx.fillStyle = a.shirt;
  ctx.beginPath();
  ctx.roundRect(-12, -6, 24, 22, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // brazos
  ctx.strokeStyle = a.skin;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-17, 10 - step * 3);
  ctx.moveTo(12, 0);
  ctx.lineTo(17, 10 + step * 3);
  ctx.stroke();

  // pelo largo / coleta detrás
  ctx.fillStyle = a.hairColor;
  if (a.hair === 'largo') {
    ctx.beginPath();
    ctx.roundRect(-15, -26, 30, 30, 10);
    ctx.fill();
  } else if (a.hair === 'coleta') {
    ctx.beginPath();
    ctx.arc(-facing * 15, -18, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // cabeza
  ctx.fillStyle = a.skin;
  ctx.beginPath();
  ctx.arc(0, -18, 14, 0, Math.PI * 2);
  ctx.fill();

  // pelo arriba
  ctx.fillStyle = a.hairColor;
  if (a.hair === 'crespo') {
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(i * 6, -30 + Math.abs(i), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (a.hair !== 'calvo') {
    ctx.beginPath();
    ctx.arc(0, -21, 14.5, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  }

  // ojos
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(facing * 3 - 4, -18, 2, 0, Math.PI * 2);
  ctx.arc(facing * 3 + 5, -18, 2, 0, Math.PI * 2);
  ctx.fill();
  // sonrisa
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(facing * 2, -13, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // cachetes
  ctx.fillStyle = 'rgba(244,114,182,0.45)';
  ctx.beginPath();
  ctx.arc(facing * 3 - 8, -13, 2.5, 0, Math.PI * 2);
  ctx.arc(facing * 3 + 9, -13, 2.5, 0, Math.PI * 2);
  ctx.fill();

  const acc = ACCESSORY_EMOJI[a.accessory];
  if (acc && a.accessory !== 'capa') {
    if (a.accessory === 'gafas') drawEmoji(ctx, acc, facing * 2, -18, 20);
    else if (a.accessory === 'audifonos') drawEmoji(ctx, acc, 0, -22, 30);
    else drawEmoji(ctx, acc, 0, -34, 24);
  }

  ctx.restore();
}

