// ---------------------------------------------------------------------------
// Datos del juego: canecas, basuras, niveles, tienda, preguntas y álbum.
// Las canecas siguen el código de colores de Colombia (Res. 2184 de 2019):
//   Verde = orgánicos · Blanca = aprovechables · Negra = no aprovechables
// y la Roja para residuos peligrosos (puntos posconsumo).
// ---------------------------------------------------------------------------

export type BinType = 'verde' | 'blanca' | 'negra' | 'roja';

export interface BinInfo {
  type: BinType;
  name: string;
  short: string;
  color: string;
  dark: string;
  icon: string;
  hint: string;
}

export const BINS: Record<BinType, BinInfo> = {
  verde: {
    type: 'verde',
    name: 'Caneca VERDE',
    short: 'Orgánicos',
    color: '#22c55e',
    dark: '#15803d',
    icon: '🍌',
    hint: 'Restos de comida, cáscaras y hojas',
  },
  blanca: {
    type: 'blanca',
    name: 'Caneca BLANCA',
    short: 'Reciclables',
    color: '#f8fafc',
    dark: '#94a3b8',
    icon: '♻️',
    hint: 'Plástico, cartón, papel, vidrio y latas LIMPIOS',
  },
  negra: {
    type: 'negra',
    name: 'Caneca NEGRA',
    short: 'No reciclables',
    color: '#334155',
    dark: '#0f172a',
    icon: '🧻',
    hint: 'Papel higiénico, servilletas sucias, tapabocas',
  },
  roja: {
    type: 'roja',
    name: 'Caneca ROJA',
    short: 'Peligrosos',
    color: '#ef4444',
    dark: '#991b1b',
    icon: '🔋',
    hint: 'Pilas, medicinas y bombillos',
  },
};

export interface TrashKind {
  icon: string;
  name: string;
  bin: BinType;
}

export const TRASH: TrashKind[] = [
  { icon: '🍌', name: 'Cáscara de banano', bin: 'verde' },
  { icon: '🍎', name: 'Corazón de manzana', bin: 'verde' },
  { icon: '🥑', name: 'Cáscara de aguacate', bin: 'verde' },
  { icon: '🥚', name: 'Cáscara de huevo', bin: 'verde' },
  { icon: '🍂', name: 'Hojas secas', bin: 'verde' },
  { icon: '🌽', name: 'Tusa de mazorca', bin: 'verde' },
  { icon: '🍉', name: 'Cáscara de sandía', bin: 'verde' },

  { icon: '🧴', name: 'Botella plástica', bin: 'blanca' },
  { icon: '📦', name: 'Caja de cartón', bin: 'blanca' },
  { icon: '📰', name: 'Periódico', bin: 'blanca' },
  { icon: '🥫', name: 'Lata', bin: 'blanca' },
  { icon: '🍾', name: 'Botella de vidrio', bin: 'blanca' },
  { icon: '🫙', name: 'Frasco de vidrio', bin: 'blanca' },
  { icon: '🥤', name: 'Vaso plástico limpio', bin: 'blanca' },

  { icon: '🧻', name: 'Papel higiénico', bin: 'negra' },
  { icon: '😷', name: 'Tapabocas usado', bin: 'negra' },
  { icon: '🩹', name: 'Curita usada', bin: 'negra' },
  { icon: '🍬', name: 'Envoltura de dulce', bin: 'negra' },
  { icon: '🪥', name: 'Cepillo de dientes viejo', bin: 'negra' },

  { icon: '🔋', name: 'Pila', bin: 'roja' },
  { icon: '💊', name: 'Medicinas vencidas', bin: 'roja' },
  { icon: '💡', name: 'Bombillo', bin: 'roja' },
  { icon: '📱', name: 'Celular dañado', bin: 'roja' },
];

export type GoalKind = 'sort' | 'befriend' | 'plant' | 'monsters' | 'filters' | 'egg' | 'nests';

export interface LevelConfig {
  number: number;
  place: string;
  title: string;
  emoji: string;
  intro: string;
  bins: BinType[];
  sortGoal: number;
  extra: GoalKind;
  extraGoal: number;
  time: number;
  villain: { name: string; icon: string; hp: number; speed: number; dropEvery: number };
  sky: [string, string];
  ground: string;
  decor: string[];
}

export const LEVELS: LevelConfig[] = [
  {
    number: 1,
    place: 'Parque Explora',
    title: 'El Acuario Mágico',
    emoji: '🐠',
    intro: 'Recoge la basura y llévala a la caneca de su color. ¡Así los peces quedan felices!',
    bins: ['verde', 'blanca', 'negra'],
    sortGoal: 5,
    extra: 'sort',
    extraGoal: 0,
    time: 120,
    villain: { name: 'Basurín', icon: '🦠', hp: 3, speed: 50, dropEvery: 12 },
    sky: ['#7dd3fc', '#0ea5e9'],
    ground: '#0369a1',
    decor: ['🐠', '🐟', '🪸', '🐡', '🫧'],
  },
  {
    number: 2,
    place: 'Río Medellín',
    title: 'El Río Brillante',
    emoji: '🌊',
    intro: 'El Pulpo Mugroso ensucia el río. Mójalo con tu pistola de agua 💦 para calmarlo.',
    bins: ['verde', 'blanca', 'negra'],
    sortGoal: 7,
    extra: 'befriend',
    extraGoal: 1,
    time: 120,
    villain: { name: 'Pulpo Mugroso', icon: '🐙', hp: 4, speed: 60, dropEvery: 10 },
    sky: ['#bae6fd', '#38bdf8'],
    ground: '#0284c7',
    decor: ['🦆', '🌉', '🐟', '🌿', '🚲'],
  },
  {
    number: 3,
    place: 'Jardín Botánico',
    title: 'Flores del Orquideorama',
    emoji: '🌺',
    intro: 'Camina sobre los huequitos de tierra 🟫 para sembrar flores. ¡Y recicla!',
    bins: ['verde', 'blanca', 'negra'],
    sortGoal: 5,
    extra: 'plant',
    extraGoal: 5,
    time: 130,
    villain: { name: 'Nube de Humo', icon: '🌫️', hp: 4, speed: 60, dropEvery: 11 },
    sky: ['#bbf7d0', '#4ade80'],
    ground: '#15803d',
    decor: ['🌸', '🦋', '🌷', '🐦', '🌻'],
  },
  {
    number: 4,
    place: 'Comuna 13',
    title: 'Grafitis y Colores',
    emoji: '🎨',
    intro: '¡Nueva caneca ROJA para pilas y medicinas! Moja a los 3 monstruos de smog para volverlos amigos.',
    bins: ['verde', 'blanca', 'negra', 'roja'],
    sortGoal: 6,
    extra: 'monsters',
    extraGoal: 3,
    time: 140,
    villain: { name: 'Lata Loca', icon: '🥫', hp: 4, speed: 70, dropEvery: 10 },
    sky: ['#fde68a', '#fb923c'],
    ground: '#c2410c',
    decor: ['🎨', '🎤', '🏘️', '🎶', '🖌️'],
  },
  {
    number: 5,
    place: 'Metrocable y Parque Arví',
    title: 'Viaje por las Nubes',
    emoji: '🚡',
    intro: 'Toca los 5 filtros de aire 🌀 para limpiar el cielo del Metrocable.',
    bins: ['verde', 'blanca', 'negra', 'roja'],
    sortGoal: 7,
    extra: 'filters',
    extraGoal: 5,
    time: 140,
    villain: { name: 'Señor Smog', icon: '💨', hp: 5, speed: 75, dropEvery: 9 },
    sky: ['#e0f2fe', '#7dd3fc'],
    ground: '#166534',
    decor: ['🚡', '☁️', '🌲', '🦜', '⛰️'],
  },
  {
    number: 6,
    place: 'Cerro Nutibara',
    title: 'Guayacanes del Pueblito Paisa',
    emoji: '🌳',
    intro: 'Siembra 6 guayacanes en la tierra 🟫. ¡Medellín será más verde!',
    bins: ['verde', 'blanca', 'negra', 'roja'],
    sortGoal: 6,
    extra: 'plant',
    extraGoal: 6,
    time: 140,
    villain: { name: 'Diablito Quemón', icon: '😈', hp: 5, speed: 80, dropEvery: 9 },
    sky: ['#fef3c7', '#fbbf24'],
    ground: '#a16207',
    decor: ['🏘️', '⛪', '☀️', '🐴', '🌼'],
  },
  {
    number: 7,
    place: 'Metro de Medellín',
    title: 'La Estación Limpia',
    emoji: '🚇',
    intro: 'El Zombi Plástico quiere ensuciar el Metro. ¡Mójalo hasta que se vuelva tu amigo!',
    bins: ['verde', 'blanca', 'negra', 'roja'],
    sortGoal: 8,
    extra: 'befriend',
    extraGoal: 1,
    time: 150,
    villain: { name: 'Zombi Plástico', icon: '🧟', hp: 7, speed: 85, dropEvery: 8 },
    sky: ['#d9f99d', '#65a30d'],
    ground: '#3f6212',
    decor: ['🚇', '🏙️', '🚉', '🎫', '🚦'],
  },
  {
    number: 8,
    place: 'Represa de Guatapé',
    title: 'El Huevo de Dragón',
    emoji: '🥚',
    intro: 'Tapa los 5 barriles tóxicos 🛢️ y aparecerá un huevo misterioso... ¡Atrápalo! Cuidado con los peces globo 🐡.',
    bins: ['verde', 'blanca', 'negra', 'roja'],
    sortGoal: 5,
    extra: 'egg',
    extraGoal: 5,
    time: 150,
    villain: { name: 'Tiburón Tóxico', icon: '🦈', hp: 6, speed: 90, dropEvery: 9 },
    sky: ['#a5f3fc', '#06b6d4'],
    ground: '#0e7490',
    decor: ['🪨', '⛵', '🏝️', '🐟', '🫧'],
  },
  {
    number: 9,
    place: 'Bosque de Santa Elena',
    title: 'Nidos de Dinosaurio',
    emoji: '🦕',
    intro: 'Viene lluvia ácida 🌧️. Toca los 5 nidos para ponerles una sombrilla ☂️.',
    bins: ['verde', 'blanca', 'negra', 'roja'],
    sortGoal: 7,
    extra: 'nests',
    extraGoal: 5,
    time: 150,
    villain: { name: 'T-Rex Alquitrán', icon: '🦖', hp: 7, speed: 90, dropEvery: 8 },
    sky: ['#bbf7d0', '#22c55e'],
    ground: '#14532d',
    decor: ['🌴', '🦕', '🌿', '🍄', '🦜'],
  },
  {
    number: 10,
    place: 'Plaza Botero',
    title: '¡La Gran Final!',
    emoji: '👑',
    intro: '¡El Basurote Supremo llegó! Recicla 10 cosas y mójalo hasta que se vuelva bueno. ¡Tú puedes!',
    bins: ['verde', 'blanca', 'negra', 'roja'],
    sortGoal: 10,
    extra: 'befriend',
    extraGoal: 1,
    time: 180,
    villain: { name: 'Basurote Supremo', icon: '👹', hp: 12, speed: 95, dropEvery: 7 },
    sky: ['#f5d0fe', '#c084fc'],
    ground: '#7e22ce',
    decor: ['🗿', '🏛️', '🕊️', '🎈', '⭐'],
  },
];

export const EXTRA_LABEL: Record<GoalKind, { icon: string; text: string }> = {
  sort: { icon: '', text: '' },
  befriend: { icon: '💦', text: 'Calma al villano' },
  plant: { icon: '🌱', text: 'Siembra' },
  monsters: { icon: '👾', text: 'Monstruos amigos' },
  filters: { icon: '🌀', text: 'Filtros' },
  egg: { icon: '🛢️', text: 'Barriles + huevo' },
  nests: { icon: '☂️', text: 'Nidos' },
};

// ---------------------------------------------------------------------------
// Tienda (solo monedas 🪙, todo tiene un efecto real en el juego)
// ---------------------------------------------------------------------------
export type ShopId =
  | 'tenis'
  | 'carriel'
  | 'pistola'
  | 'reloj'
  | 'iman'
  | 'sombrero'
  | 'audifonos'
  | 'capa'
  | 'gafas'
  | 'corona';

export interface ShopItem {
  id: ShopId;
  name: string;
  icon: string;
  price: number;
  kind: 'poder' | 'ropa';
  description: string;
}

export const SHOP: ShopItem[] = [
  { id: 'tenis', name: 'Tenis Veloces', icon: '👟', price: 120, kind: 'poder', description: '¡Corres mucho más rápido!' },
  { id: 'carriel', name: 'Carriel Paisa', icon: '👜', price: 200, kind: 'poder', description: 'Cargas hasta 3 basuras del mismo color.' },
  { id: 'pistola', name: 'Súper Pistola de Agua', icon: '🔫', price: 180, kind: 'poder', description: 'Disparas más rápido y más fuerte.' },
  { id: 'reloj', name: 'Reloj Mágico', icon: '⏰', price: 150, kind: 'poder', description: '+20 segundos en cada nivel.' },
  { id: 'iman', name: 'Imán Ecológico', icon: '🧲', price: 250, kind: 'poder', description: 'La basura cercana viene hacia ti.' },
  { id: 'sombrero', name: 'Sombrero Vueltiao', icon: '👒', price: 60, kind: 'ropa', description: '¡Orgullo colombiano!' },
  { id: 'audifonos', name: 'Audífonos', icon: '🎧', price: 60, kind: 'ropa', description: 'Para reciclar con música.' },
  { id: 'gafas', name: 'Gafas de Sol', icon: '🕶️', price: 80, kind: 'ropa', description: 'Súper estilo paisa.' },
  { id: 'capa', name: 'Capa de Héroe', icon: '🦸', price: 120, kind: 'ropa', description: 'Para el héroe del planeta.' },
  { id: 'corona', name: 'Corona de Campeón', icon: '👑', price: 400, kind: 'ropa', description: 'Solo para los mejores.' },
];

// ---------------------------------------------------------------------------
// Preguntas Paisas (cada una da monedas una sola vez)
// ---------------------------------------------------------------------------
export interface Question {
  id: string;
  who: string;
  avatar: string;
  question: string;
  options: string[];
  correct: number;
  explain: string;
  reward: number;
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    who: 'Don Mateo el Cafetero',
    avatar: '👴',
    question: '¿En qué caneca va la cáscara de banano?',
    options: ['Verde 🟢', 'Blanca ⚪', 'Negra ⚫'],
    correct: 0,
    explain: '¡Sí! Los restos de comida van en la VERDE y se convierten en abono para las plantas.',
    reward: 30,
  },
  {
    id: 'q2',
    who: 'Doña Gloria la Silletera',
    avatar: '👵',
    question: 'Encontré una botella plástica limpia. ¿Dónde la boto?',
    options: ['Negra ⚫', 'Blanca ⚪', 'Al río 🌊'],
    correct: 1,
    explain: '¡Muy bien! Lo que se puede reciclar (y está limpio) va en la BLANCA.',
    reward: 30,
  },
  {
    id: 'q3',
    who: 'Sofía la Científica',
    avatar: '👩‍🔬',
    question: '¿Qué hacemos con las pilas usadas?',
    options: ['Botarlas en la verde', 'Enterrarlas', 'Llevarlas a un punto de pilas 🔴'],
    correct: 2,
    explain: '¡Exacto! Las pilas son peligrosas. Se llevan a puntos especiales de recolección.',
    reward: 40,
  },
  {
    id: 'q4',
    who: 'Lucas el Skater',
    avatar: '🛹',
    question: '¿Cuál es una forma de moverse sin contaminar en Medellín?',
    options: ['Metro y EnCicla 🚇🚲', 'Un carro viejo con humo', 'Moto sin silenciador'],
    correct: 0,
    explain: '¡Bacano! El Metro es eléctrico y las bicicletas EnCicla no echan humo.',
    reward: 30,
  },
  {
    id: 'q5',
    who: 'La Profe Marcela',
    avatar: '👩‍🏫',
    question: 'El papel higiénico usado va en la caneca...',
    options: ['Blanca ⚪', 'Negra ⚫', 'Verde 🟢'],
    correct: 1,
    explain: '¡Correcto! Lo que está sucio y no se puede reciclar va en la NEGRA.',
    reward: 30,
  },
  {
    id: 'q6',
    who: 'Don Ramón el de la Chiva',
    avatar: '🚌',
    question: '¿Cómo ahorramos agua en casa?',
    options: ['Dejar la llave abierta', 'Cerrar la llave al cepillarnos 🪥', 'Bañarnos una hora'],
    correct: 1,
    explain: '¡Eso es! Cerrar la llave ahorra muchísima agua cada día.',
    reward: 30,
  },
  {
    id: 'q7',
    who: 'Valentina la Exploradora',
    avatar: '🧒',
    question: '¿Cuál es el árbol de flores amarillas famoso en Medellín?',
    options: ['El Guayacán 🌳', 'El Pino', 'La Palma de cera'],
    correct: 0,
    explain: '¡Sí! Los guayacanes llenan la ciudad de flores amarillas y rosadas.',
    reward: 40,
  },
  {
    id: 'q8',
    who: 'Don Mateo el Cafetero',
    avatar: '👴',
    question: '¿Qué podemos hacer con los restos de comida?',
    options: ['Abono (compost) 🌱', 'Tirarlos a la calle', 'Quemarlos'],
    correct: 0,
    explain: '¡Muy bien! El compost alimenta la tierra para que crezcan plantas nuevas.',
    reward: 30,
  },
  {
    id: 'q9',
    who: 'Sofía la Científica',
    avatar: '👩‍🔬',
    question: '¿Cuánto tarda una botella plástica en desaparecer?',
    options: ['1 semana', '1 año', '¡Cientos de años! ⏳'],
    correct: 2,
    explain: '¡Así es! Por eso es tan importante reciclarla.',
    reward: 40,
  },
  {
    id: 'q10',
    who: 'Doña Gloria la Silletera',
    avatar: '👵',
    question: '¿Qué fiesta de Medellín tiene silletas de flores?',
    options: ['La Feria de las Flores 💐', 'El Carnaval de Barranquilla', 'Halloween'],
    correct: 0,
    explain: '¡Correcto! En agosto los silleteros de Santa Elena desfilan con flores.',
    reward: 40,
  },
];

// ---------------------------------------------------------------------------
// Álbum: una lámina por cada nivel ganado
// ---------------------------------------------------------------------------
export const ALBUM_FACTS: Record<number, string> = {
  1: 'Parque Explora tiene el acuario de agua dulce más grande de Sudamérica. 🐠',
  2: 'El río Medellín atraviesa todo el Valle de Aburrá. ¡Muchas aves viven en sus orillas! 🦆',
  3: 'El Orquideorama del Jardín Botánico parece un gran panal de madera. 🐝',
  4: 'La Comuna 13 tiene escaleras eléctricas al aire libre y grafitis gigantes. 🎨',
  5: 'Medellín fue de las primeras ciudades del mundo en usar cable aéreo como transporte público. 🚡',
  6: 'En el Cerro Nutibara está el Pueblito Paisa, ¡un pueblo antioqueño en miniatura! 🏘️',
  7: 'El Metro de Medellín es el único metro de Colombia y funciona con electricidad. ⚡',
  8: 'En Guatapé está la Piedra del Peñol: ¡tiene más de 700 escalones! 🪨',
  9: 'En Santa Elena viven los silleteros que hacen la Feria de las Flores. 💐',
  10: 'La Plaza Botero tiene 23 esculturas gigantes de bronce del maestro Fernando Botero. 🗿',
};

