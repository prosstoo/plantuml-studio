# PlantUML Studio

Веб-редактор PlantUML с live-превью, поддержкой `!include`, панелью быстрых вставок и экспортом в SVG/PNG. Работает полностью в браузере без сервера.

![PlantUML Studio](https://img.shields.io/badge/PlantUML-Studio-3ecf8e)

## Возможности

- **Live-превью** — автоматический рендеринг при редактировании (debounce 500 мс)
- **UML-диаграммы** — sequence, state, class, activity, component, use case и др.
- **Мультифайловые проекты** — поддержка `!include` (открытие папки с `.puml`)
- **Быстрые вставки** — сниппеты для Sequence, State, Class, Activity
- **Экспорт** — скачивание SVG и PNG
- **Zoom/Pan** — масштабирование и панорамирование превью
- **Тёмная/светлая тема** — для интерфейса и диаграмм
- **Автосохранение** — проект сохраняется в localStorage

## Быстрый старт

```bash
git clone https://github.com/prosstoo/plantuml-studio.git
cd plantuml-studio
npm install
npm run dev
```

Откройте http://localhost:5173 в браузере.

## Сборка

```bash
npm run build
npm run build:pages
npm run preview
```

## Деплой на GitHub Pages

1. В настройках репозитория: **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. При push в ветку `main` workflow автоматически соберёт и опубликует сайт
3. Сайт: `https://prosstoo.github.io/plantuml-studio/`

## Использование

### Открытие папки с диаграммами

1. Нажмите **«Открыть папку»** и выберите каталог с `.puml` файлами
2. Файлы с `!include` (например `_common.puml`) будут автоматически разрешены
3. Также можно перетащить файлы/папку в область тулбара (drag & drop)

### Быстрые вставки

В левой панели выберите категорию (Sequence, State, Class, Activity) и нажмите на сниппет — код вставится в позицию курсора.

### Экспорт

1. Дождитесь успешного рендеринга (статус «OK»)
2. Нажмите **«Экспорт ▾»** → **Скачать SVG** или **Скачать PNG**

### Примеры

Кнопка **«Примеры ▾»** загружает готовые диаграммы:
- Пустой шаблон
- Sequence — реестр заказов
- State — статусная схема

## Технологии

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [@plantuml/core](https://www.npmjs.com/package/@plantuml/core)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)

## Лицензия

MIT — см. [LICENSE](LICENSE).
