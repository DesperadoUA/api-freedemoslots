# API — руководство для фронтенда

Базовый URL (dev): `http://localhost:7000/api`  
Прод: подставить домен бэкенда. Все публичные роуты начинаются с `/api`.

---

## Общий формат ответа

**Успех (200)**

```json
{
  "status": "ok",
  "body": { ... }
}
```

**Не найдено (404)**

```json
{
  "status": "error"
}
```

Данные всегда в `body`. Ошибок с текстом в теле нет — проверять HTTP-код и `status`.

---

## Язык

Первый сегмент пути — код языка: `en`, `ua`, `de`, `es`, `fr`, `ru`, и т.д. (см. `_LANG_ID` в `config/index.js`).

Пример: `/api/en/page/main`, `/api/ru/vendor/pragmatic-play`.

Неподдерживаемый язык → страница/сущность не отдаётся (404).

---

## Query-параметры (пагинация)

Работают на эндпоинтах, где указано «поддерживает limit/offset».

| Параметр | По умолчанию | Описание |
|----------|--------------|----------|
| `limit`  | `10` (страницы), `20` (провайдер `/vendor/:url` → `posts`) | Размер страницы (целое число) |
| `offset` | `0`          | Сдвиг (целое число) |

Пример: `?limit=20&offset=40`

**Важно:** значения должны быть **целыми** (`20`, не `20.5`). Иначе параметр игнорируется и остаётся дефолт.

На списковых **страницах** (`/page/...`):

- массив в `body` (например `vendors`, `themes`) — срез по `limit`/`offset`;
- `body.total` — **полное** число public-записей для пагинации UI.

---

## Карточка слота (краткая)

Используется в списках `posts`, `slots`, на главной и т.д.

```json
{
  "title": "Book of Dead",
  "permalink": "book-of-dead",
  "thumbnail": "http://127.0.0.1:7000/img/...",
  "vendor": {
    "title": "Play'n GO",
    "permalink": "play-n-go"
  }
}
```

`vendor` может отсутствовать, если провайдер не привязан.

---

## Карточка фильтра (провайдер, тема, фича, тип, серия, волатильность, live)

Используется на статических страницах-каталогах:

```json
{
  "title": "Slots",
  "permalink": "slots",
  "slotCounter": 1234
}
```

`slotCounter` — число **public** слотов с **public** провайдером, связанных с этой сущностью.

---

## Статические страницы

`GET /api/:lang/page/:permalink`

SEO-поля страницы всегда в `body`: `title`, `permalink`, `h1`, `meta_title`, `description`, `keywords`, `content` (HTML после decode), `thumbnail`, `short_desc`, и др.

Дополнительные поля зависят от `permalink`:

| permalink | Массив в `body` | `total` | limit/offset |
|-----------|-----------------|--------|--------------|
| `main` | `slots` (8), `vendors` (8) | нет | нет |
| `providers` | `vendors` | да | да |
| `slot-themes` | `themes` | да | да |
| `slot-features` | `features` | да | да |
| `volatillity-rate` | `volatilities` | да | да *(опечатка в permalink — так в БД)* |
| `casino-games` | `types` | да | да |
| `casino-game-series` | `series` | да | да |
| `live-casino-games` | `live_casino` | да | да |

### Примеры

```
GET /api/en/page/main
GET /api/en/page/providers?limit=20&offset=0
GET /api/en/page/slot-themes?limit=50&offset=0
GET /api/en/page/slot-features?limit=20&offset=0
GET /api/en/page/volatillity-rate?limit=20&offset=0
GET /api/en/page/casino-games?limit=20&offset=0
GET /api/en/page/casino-game-series?limit=20&offset=0
GET /api/en/page/live-casino-games?limit=20&offset=0
```

### Пагинация на фронте

```
страниц = Math.ceil(body.total / limit)
следующий offset = текущий offset + limit
```

---

## Детальная страница сущности (SEO + слоты)

Полные мета-поля сущности + список слотов в `posts` (карточки слота).  
Где указано — есть `total`, `limit`, `offset` на список `posts`.

| Сущность | Метод | limit/offset |
|----------|-------|--------------|
| Провайдер | `GET /api/:lang/vendor/:permalink` | да *(слоты — пагинация в БД, без загрузки всех relatives)* |
| Тема | `GET /api/:lang/theme/:permalink` | да (`posts`, `best_games`, `latest_games`, `total`; без `game_types`) |
| Фича | `GET /api/:lang/feature/:permalink` | да |
| Волатильность | `GET /api/:lang/volatility/:permalink` | да |
| Тип игры | `GET /api/:lang/type/:permalink` | **нет** — все слоты в `posts` сразу |
| Серия | `GET /api/:lang/series/:permalink` | да |
| Live casino | `GET /api/:lang/live-casino/:permalink` | да |

Примеры:

```
GET /api/en/vendor/pragmatic-play?limit=24&offset=0
GET /api/en/theme/egypt?limit=24&offset=0
GET /api/en/feature/free-spins?limit=24&offset=0
GET /api/en/volatility/high?limit=24&offset=0
GET /api/en/type/slots
GET /api/en/series/book-of-dead-series?limit=24&offset=0
GET /api/en/live-casino/game-shows?limit=24&offset=0
```

Типичный фрагмент ответа:

```json
{
  "status": "ok",
  "body": {
    "title": "Pragmatic Play",
    "permalink": "pragmatic-play",
    "h1": "...",
    "meta_title": "...",
    "description": "...",
    "content": "...",
    "posts": [ /* карточки слота */ ],
    "total": 500
  }
}
```

---

## Страница слота

`GET /api/:lang/:vendor/:slot-permalink?limit=&offset=`

- `vendor` — permalink провайдера (как в карточке слота).
- Слот должен быть `public` и привязан к public-провайдеру.

Пример:

```
GET /api/en/pragmatic-play/gates-of-olympus?limit=12&offset=0
```

Ответ (`body`):

- SEO-поля слота;
- meta: `demo`, `faq` (массив), `release_date`, `rtp`, `paylines`, `reels`, `layout`, `min_bet`, `max_bet`, `max_win`;
- `vendor`: `{ title, permalink }`;
- `slots` — другие слоты того же провайдера (карточки), с пагинацией;
- `total` — всего таких слотов (без текущего).

**Страница провайдера** (`GET /api/:lang/vendor/:permalink`):

- `posts` — слоты с пагинацией (`limit`/`offset`);
- `total` — всего public-слотов провайдера;
- `game_types` — массив уникальных типов по **всем** слотам провайдера: `{ title, permalink }` (типы + live-категории).
- `best_games` — до **12** лучших игр провайдера (`slot_meta.best = 1`), те же карточки что в `posts` (`title`, `permalink`, `thumbnail`, `best`, `vendor`).
- `latest_games` — до **12** новинок по `slot_meta.release_date` (DESC), только даты формата `YYYY-MM-DD`; в карточке дополнительно `release_date`.

Пример `game_types`: `["Baccarat", "Dice", "Game Shows", "Keno", "Slots", "Video Poker"]`

**Страница темы** (`GET /api/:lang/theme/:permalink`, напр. `slot-themes/animals` → `theme/animals`):

- `posts` — слоты с пагинацией (дефолт `limit=20`);
- `total` — всего public-слотов темы (с public-провайдером);
- `best_games` — до **12** лучших (`best = 1`);
- `latest_games` — до **12** новинок по `release_date`;
- карточка: `title`, `permalink`, `thumbnail`, `best`, `vendor` (+ `release_date` в `latest_games`).

Связи `slot_*_relative` в ответ **не попадают** (вырезаются на бэке).

---

## Категории слотов

`GET /api/slots/:permalink` — категория слотов (без `:lang` в пути, логика в `CategoryService`).

Использовать, если на фронте заведены URL категорий слотов; формат ответа — через `BaseCategoryService` (SEO + контент категории).

---

## Настройки сайта

`GET /api/:lang/settings`

Массив пар ключ/значение для шапки, футера, меню и т.д.:

```json
{
  "status": "ok",
  "body": [
    { "key": "menu", "value": { ... } },
    { "key": "footer", "value": "..." }
  ]
}
```

`value` может быть объектом (JSON из БД) или строкой — парсится на бэке.

---

## Статика

- Картинки по умолчанию и загрузки: `http://<host>/img/...`
- `thumbnail` в API часто полный URL (см. `_THUMBNAIL` в config).

---

## Правила отображения слотов

На бэке в счётчики и выборки попадают только:

1. `slots.status = public`
2. У слота есть привязка к `vendor` со `status = public`
3. Для EN-контента связи в БД завязаны на `lang = 1`

Фронту отдельно фильтровать не нужно — API уже отдаёт отфильтрованное.

---

## Админка (не для публичного фронта)

Роуты с префиксом `/api/admin/...` — POST, нужен auth (cookie/token middleware `auth`).  
Примеры: `/admin/slots`, `/admin/vendors`, `/admin/pages`, загрузка `/admin/uploads`.

Публичный фронт использует только `GET` из разделов выше.

---

## Сводка URL для типовых экранов

| Экран | API |
|-------|-----|
| Главная | `GET /api/{lang}/page/main` |
| Все провайдеры | `GET /api/{lang}/page/providers?limit&offset` |
| Провайдер | `GET /api/{lang}/vendor/{slug}?limit&offset` |
| Темы (каталог) | `GET /api/{lang}/page/slot-themes?limit&offset` |
| Тема | `GET /api/{lang}/theme/{slug}?limit&offset` |
| Фичи (каталог) | `GET /api/{lang}/page/slot-features?limit&offset` |
| Фича | `GET /api/{lang}/feature/{slug}?limit&offset` |
| Волатильность (каталог) | `GET /api/{lang}/page/volatillity-rate?limit&offset` |
| Волатильность | `GET /api/{lang}/volatility/{slug}?limit&offset` |
| Типы игр (каталог) | `GET /api/{lang}/page/casino-games?limit&offset` |
| Тип | `GET /api/{lang}/type/{slug}` |
| Серии (каталог) | `GET /api/{lang}/page/casino-game-series?limit&offset` |
| Серия | `GET /api/{lang}/series/{slug}?limit&offset` |
| Live (каталог) | `GET /api/{lang}/page/live-casino-games?limit&offset` |
| Live-категория | `GET /api/{lang}/live-casino/{slug}?limit&offset` |
| Слот | `GET /api/{lang}/{vendor}/{slot}?limit&offset` |
| Настройки | `GET /api/{lang}/settings` |

---

## Замечания для интеграции

1. **`/api/en/type/...`** — без пагинации; на больших типах (например Slots) список `posts` может быть тяжёлым — при необходимости обсудить доработку бэка.
2. Permalink **`volatillity-rate`** — с опечаткой, менять URL на фронте без миграции БД нельзя.
3. CORS включён (`cors()` в `app.js`) — запросы с другого origin в dev разрешены.
4. Дефолт `limit` на страницах = **10**; для сеток обычно передавать `limit=20` или `24` явно.
