# Doni’s Kitchen — сайт за рецепти

React + Vite. Всяка рецепта е markdown файл в `src/recipes/`. Името на файла става адресът ѝ (`tikvena-supa.md` → `#/recipe/tikvena-supa`).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # статичен сайт в dist/
```

## Формат на рецепта

```markdown
---
title: Име на рецептата
category: Супи            # име или slug от src/categories.js
image: https://...        # URL или /snimka.jpg (файл в public/)
description: Кратко описание за картата.
prep: 15                  # минути подготовка
cook: 35                  # минути готвене
servings: 4
difficulty: Лесно         # Лесно | Средно | Трудно
tags: [вегетарианско, есен]
---

Въвеждащ текст (по желание).

## Продукти
### Група (по желание)
- 1 кг тиква              # числото в началото се мащабира с порциите (1.5, 1/2, ½)
- сол на вкус

## Стъпки
1. Печете **25 минути**.  # времената стават бутони за таймер

## Съвети                  # всяка друга ## секция се показва като текст
- ...
```
