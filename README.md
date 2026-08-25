# ЦАРСКИЙ ГАЗОН

Одностраничный сайт сервиса ухода за газоном в Пушкине и Александровке.
SPA на Vite + React + TypeScript, 3D на three.js, деплой на GitHub Pages.

**Живой сайт:** https://kewldan.github.io/tsar-trava/

---

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # проверка типов + сборка в dist/
npm run preview    # посмотреть собранное
```

Нужен Node 20+.

## Что где лежит

```
src/
  content.ts              ← ВЕСЬ текст, цены, тарифы, команда, FAQ. Правки — сюда
  App.tsx                 порядок секций, Lenis, прелоадер
  components/             секции страницы
    ui/Primitives.tsx     Reveal, SplitText, Counter, Magnetic, Marquee, Btn
    OsmMap.tsx            карта территории
  three/
    GrassScene.tsx        поле травы на первом экране
    grassShaders.ts       GLSL: ветер, полосы покоса, туман, пыльца
    Scissors.tsx          маникюрные ножницы в блоке «Парк»
  styles/                 base.css (токены) · ui.css (примитивы) · sections.css
  data/pushkin-map.json   геометрия карты, 58 КБ
  lib/hooks.ts            useInView, useTilt, useMagnetic, useCountUp и прочее
public/team/              портреты мастеров
scripts/build-map.mjs     пересборка карты из OpenStreetMap
docs/gemini-prompt.md     промпт для генерации портретов
```

## Частые правки

**Цены и тексты** — `src/content.ts`, больше нигде цифры не дублируются.

**Контакты** — `CONTACTS` в `src/content.ts`. Если появится бэкенд для формы,
проставьте `formEndpoint` — форма начнёт слать `POST` вместо открытия Telegram.

**Портреты мастеров** — положить файл в `public/team/`, прописать имя в `photo`
в массиве `TEAM`. Кадр 3:4. Промпт для генерации — `docs/gemini-prompt.md`.

**Палитра** — CSS-переменные в начале `src/styles/base.css`.

## Карта

Карта — не картинка и не тайловый сервис. Геометрия выгружена из OpenStreetMap
через Overpass, спроецирована в Web Mercator, упрощена алгоритмом
Дугласа–Пекера и лежит в репозитории отдельным JSON. Рендерится своим
SVG-рендерером, поэтому красится в палитру сайта и не зависит от внешних
серверов. Пересобрать — см. шапку `scripts/build-map.mjs`.

Данные © OpenStreetMap contributors, лицензия ODbL.

## 3D и производительность

Поле травы — инстансинг: 14 000 / 42 000 / 72 000 травинок в зависимости от
устройства (определяется по ширине экрана, типу указателя и числу ядер).
Ветер, изгиб, полосы покоса и реакция на курсор считаются в вершинном шейдере.

Ниже первого экрана сцена переводится в `frameloop="never"` — кадры не жгутся
на всей остальной странице. Прелоадер держится до первого реального кадра
WebGL, чтобы компиляция шейдеров не давала рывок на входе.

При `prefers-reduced-motion: reduce` анимации выключаются, 3D-сцена не
монтируется.

## Деплой

`.github/workflows/deploy.yml` собирает и публикует на GitHub Pages при каждом
push в `main`. Имя репозитория задано в `vite.config.ts` (`const REPO`) — от
него зависит `base` для путей к ассетам.
