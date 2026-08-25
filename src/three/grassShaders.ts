/**
 * GLSL для поля травы.
 *
 * Идея сцены: тёмный ночной газон, по которому идёт ветровая волна,
 * и на нём читается диагональный рисунок покоса — те самые полосы,
 * ради которых люди и заказывают уход. Полосы задают не только цвет,
 * но и направление наклона травинок, как на настоящем газоне:
 * в одной полосе лист лежит «от тебя», в соседней — «на тебя»,
 * поэтому они по-разному ловят свет.
 */

export const GRASS_VERT = /* glsl */ `
precision highp float;

attribute vec3  aOffset;   // позиция травинки на поле
attribute float aScale;    // высота
attribute float aRot;      // поворот вокруг Y
attribute float aPhase;    // фазовый сдвиг, чтобы не колыхались синхронно
attribute float aTint;     // индивидуальный разброс цвета

uniform float uTime;
uniform float uWind;       // общая сила ветра
uniform vec3  uMouse;      // курсор, спроецированный на землю
uniform float uMouseForce;
uniform float uScroll;     // 0..1 прогресс скролла
uniform float uStripeAngle;
uniform float uStripeFreq;

varying float vHeight;     // 0 у корня, 1 у кончика
varying float vStripe;     // -1..1 принадлежность полосе покоса
varying float vBend;       // насколько травинку положило
varying float vTint;
varying float vDepth;

// Дешёвый ветер: сумма синусов вместо шума. Дороже не нужно —
// на 30k инстансов разница видна только в профайлере.
float windField(vec2 p, float t) {
  float w  = sin(p.x * 0.70 + t * 0.85) * 0.50;
  w       += sin(p.y * 0.58 - t * 0.62) * 0.34;
  w       += sin((p.x + p.y) * 0.34 + t * 1.25) * 0.22;
  return w;
}

// Порыв: широкая волна, которая проходит через всё поле
float gustField(vec2 p, float t) {
  vec2 dir = normalize(vec2(0.82, 0.57));
  float wave = sin(dot(p, dir) * 0.22 - t * 0.42);
  return smoothstep(0.15, 1.0, wave);
}

mat2 rot2(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec3 local = position;

  // 0 у основания, 1 у кончика
  float h = clamp(local.y, 0.0, 1.0);
  vHeight = h;

  // Сужение к кончику — плоскость превращается в лист
  local.x *= (1.0 - h * 0.88);

  // Высота инстанса
  local.y *= aScale;

  // Полосы покоса: диагональ по полю
  vec2 sp = rot2(uStripeAngle) * aOffset.xz;
  float stripe = sin(sp.x * uStripeFreq);
  vStripe = stripe;

  float t = uTime + aPhase;

  // Ветер
  float gust = gustField(aOffset.xz, uTime);
  float wind = windField(aOffset.xz, t) * (0.35 + gust * 0.9) * uWind;

  // Естественный наклон: в соседних полосах лист лежит в разные стороны
  float lean = sign(stripe) * 0.34 + stripe * 0.12;

  // Курсор расталкивает траву
  vec2 toMouse = aOffset.xz - uMouse.xz;
  float md = length(toMouse);
  float push = uMouseForce * exp(-md * md * 0.9);
  vec2 pushDir = md > 0.0001 ? normalize(toMouse) : vec2(0.0, 1.0);

  // Кончик отклоняется сильнее корня — квадратичный профиль
  float profile = h * h * 1.15 + h * 0.12;
  float bend = (wind + lean) * profile;
  vBend = bend;

  // Изгиб в локальных координатах
  local.z += bend * aScale * 0.55;
  local.y -= abs(bend) * aScale * 0.16;   // укорачиваем по вертикали при наклоне
  local.x += sin(t * 1.6) * 0.05 * profile * aScale * uWind;

  // Поворот травинки вокруг своей оси
  vec2 xz = rot2(aRot) * local.xz;
  vec3 world = vec3(xz.x, local.y, xz.y) + aOffset;

  // Расталкивание курсором — уже в мировых координатах
  world.xz += pushDir * push * profile * 0.22;
  world.y  -= push * profile * 0.07;

  // Лёгкое «дыхание» поля на скролле
  world.y += sin(aOffset.x * 0.22 + aOffset.z * 0.18 + uScroll * 3.0) * uScroll * 0.05;

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
  vTint = aTint;
}
`

export const GRASS_FRAG = /* glsl */ `
precision highp float;

uniform vec3  uRoot;
uniform vec3  uMid;
uniform vec3  uTip;
uniform vec3  uBrass;
uniform vec3  uFog;
uniform float uFogNear;
uniform float uFogFar;
uniform float uTime;

varying float vHeight;
varying float vStripe;
varying float vBend;
varying float vTint;
varying float vDepth;

void main() {
  // Вертикальный градиент вдоль листа
  vec3 col = mix(uRoot, uMid, smoothstep(0.0, 0.62, vHeight));
  col = mix(col, uTip, smoothstep(0.45, 1.0, vHeight));

  // Индивидуальный разброс, чтобы поле не выглядело крашеным
  col *= 0.78 + vTint * 0.44;

  // Полосы покоса: у настоящего газона граница между полосами резкая,
  // потому что в соседних проходах лист лежит в противоположные стороны
  float stripeLight = smoothstep(-0.32, 0.32, vStripe);
  col *= mix(0.52, 1.44, stripeLight);

  // Тонкая тёмная линия ровно по стыку проходов
  col *= 1.0 - smoothstep(0.86, 1.0, 1.0 - abs(vStripe)) * 0.18;

  // Латунный блик на кончиках наклонённых травинок —
  // читается как контровой лунный свет
  float rim = smoothstep(0.55, 1.0, vHeight) * smoothstep(0.15, 0.75, abs(vBend));
  col = mix(col, uBrass, rim * 0.5 * (0.45 + stripeLight * 0.55));

  // Кончик всегда чуть ярче
  col += uBrass * pow(vHeight, 7.0) * 0.22;

  // Туман по глубине — прячет край поля
  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  col = mix(col, uFog, fog);

  // На большом удалении гасим совсем
  float alpha = 1.0 - smoothstep(uFogFar * 0.86, uFogFar * 1.02, vDepth);

  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
`

export const GROUND_VERT = /* glsl */ `
varying vec2 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const GROUND_FRAG = /* glsl */ `
precision highp float;
uniform vec3  uDark;
uniform vec3  uLit;
uniform float uStripeAngle;
uniform float uStripeFreq;
uniform vec3  uMouse;

varying vec2 vWorld;

mat2 rot2(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 sp = rot2(uStripeAngle) * vWorld;
  float raw = sin(sp.x * uStripeFreq);
  float stripe = smoothstep(-0.3, 0.3, raw);

  vec3 col = mix(uDark, uLit, stripe * 0.9);

  // Пятно света вокруг курсора
  float md = length(vWorld - uMouse.xz);
  col += uLit * 0.35 * exp(-md * md * 0.25);

  // Затемнение к горизонту
  float d = length(vWorld);
  col *= 1.0 - smoothstep(4.0, 20.0, d) * 0.94;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

export const POLLEN_VERT = /* glsl */ `
precision highp float;
attribute float aSeed;
attribute float aSize;
uniform float uTime;
uniform float uPixelRatio;
varying float vAlpha;

void main() {
  vec3 p = position;

  // Медленный дрейф вверх с закруткой
  float t = uTime * 0.16 + aSeed * 6.283;
  p.x += sin(t * 1.3 + aSeed * 12.0) * 0.7;
  p.z += cos(t * 1.1 + aSeed * 9.0) * 0.7;
  p.y = mod(p.y + uTime * 0.05 * (0.4 + aSeed * 0.9), 2.4);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;

  // Мерцание
  vAlpha = (0.25 + 0.75 * pow(sin(t * 2.1) * 0.5 + 0.5, 2.0))
         * (1.0 - smoothstep(5.0, 16.0, dist))
         * smoothstep(0.0, 0.35, p.y);

  gl_PointSize = aSize * uPixelRatio * (10.0 / max(dist, 0.5));
  gl_Position = projectionMatrix * mv;
}
`

export const POLLEN_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.4) * vAlpha;
  gl_FragColor = vec4(uColor, a);
}
`
