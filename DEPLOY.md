# Развёртывание Smart Practice на Render.com

## Подготовка

1. Создайте аккаунт на [Render.com](https://render.com)
2. Установите [Render CLI](https://render.com/docs/cli) (опционально)
3. Подготовьте токен бота от [@BotFather](https://t.me/BotFather)

## Шаг 1: Создание репозитория

Загрузите код проекта на GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/smart-practice.git
git push -u origin main
```

## Шаг 2: Развёртывание через Render Dashboard

### 2.1 Создание PostgreSQL базы данных

1. В Dashboard нажмите "New +" → "PostgreSQL"
2. Настройки:
   - **Name**: `smart-practice-db`
   - **Database**: `smart_practice`
   - **User**: оставьте по умолчанию
   - **Plan**: Free
3. Нажмите "Create Database"
4. Сохраните значения **Host**, **Port**, **Database**, **Username**, **Password** - они понадобятся позже

### 2.2 Создание Backend сервиса

1. Нажмите "New +" → "Web Service"
2. Выберите ваш GitHub репозиторий
3. Настройки:
   - **Name**: `smart-practice-api`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Plan**: Free
4. Добавьте Environment Variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `BOT_TOKEN` | ваш_токен_от_BotFather |
| `BOT_USERNAME` | username_вашего_бота |
| `ADMIN_TG_ID` | `123476570` |
| `DB_HOST` | (из настроек БД) |
| `DB_PORT` | `5432` |
| `DB_NAME` | `smart_practice` |
| `DB_USER` | (из настроек БД) |
| `DB_PASSWORD` | (из настроек БД) |
| `WEB_APP_URL` | `https://smart-practice-app.onrender.com` |
| `REACT_APP_API_URL` | `https://smart-practice-api.onrender.com/api` |

5. Нажмите "Create Web Service"

### 2.3 Создание Frontend сервиса

1. Нажмите "New +" → "Web Service"
2. Выберите тот же репозиторий
3. Настройки:
   - **Name**: `smart-practice-app`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Plan**: Free
4. Добавьте Environment Variables:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://smart-practice-api.onrender.com/api` |
| `REACT_APP_BOT_USERNAME` | username_вашего_бота |

5. Нажмите "Create Web Service"

## Шаг 3: Настройка Telegram Bot

После деплоя backend получите URL вашего API (например, `https://smart-practice-api.onrender.com`)

Установите webhook:

```bash
curl -F "url=https://smart-practice-api.onrender.com/bot<YOUR_BOT_TOKEN>" \
  https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```

Проверьте статус webhook:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Установите команды бота:

```bash
curl -X POST \
  https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyCommands \
  -H 'Content-Type: application/json' \
  -d '{
    "commands": [
      {"command": "start", "description": "Начать работу"},
      {"command": "menu", "description": "Главное меню"}
    ]
  }'
```

## Шаг 4: Настройка Mini App

1. Откройте @BotFather
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Выберите "Bot Settings" → "Menu Button" → "Configure menu button"
5. Выберите "Configure Web App"
6. Введите название кнопки: `Smart Practice`
7. Введите URL: `https://smart-practice-app.onrender.com`

## Шаг 5: Инициализация базы данных

Подключитесь к базе данных через Render Dashboard:

1. Перейдите в вашу PostgreSQL базу данных
2. Нажмите "Connect"
3. Скопируйте PSQL Command
4. Выполните SQL-скрипт из `postgres/init.sql`

Или используйте Render Shell:

```bash
# Подключитесь к shell вашего backend сервиса
# Выполните:
psql $DATABASE_URL -f postgres/init.sql
```

## Шаг 6: Проверка работоспособности

1. Откройте бота в Telegram
2. Нажмите `/start`
3. Проверьте:
   - Регистрацию нового пользователя
   - Создание профиля
   - Просмотр вакансий
   - Создание вакансии (для партнеров)

## Альтернативный способ: Deploy через render.yaml

1. Форкните репозиторий на GitHub
2. В Render Dashboard нажмите "New +" → "Blueprint"
3. Выберите ваш репозиторий
4. Render автоматически создаст все сервисы из `render.yaml`
5. Заполните необходимые Environment Variables в настройках каждого сервиса

## Устранение неполадок

### Проблема: Backend не запускается

**Решение:**
- Проверьте логи в Render Dashboard
- Убедитесь, что все Environment Variables заполнены
- Проверьте подключение к базе данных

### Проблема: Бот не отвечает

**Решение:**
- Проверьте webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Убедитесь, что BOT_TOKEN правильный
- Проверьте логи backend

### Проблема: Mini App не открывается

**Решение:**
- Проверьте URL в настройках бота (@BotFather)
- Убедитесь, что frontend сервис запущен
- Проверьте CORS настройки backend

### Проблема: Ошибки базы данных

**Решение:**
- Убедитесь, что таблицы созданы (выполните init.sql)
- Проверьте правильность credentials
- Проверьте логи подключения

## Обновление приложения

После внесения изменений в код:

```bash
git add .
git commit -m "Update description"
git push origin main
```

Render автоматически пересоберёт и redeploy'ит ваши сервисы.

## Полезные команды

### Просмотр логов

В Render Dashboard:
1. Выберите сервис
2. Перейдите на вкладку "Logs"

### Перезапуск сервиса

В настройках сервиса нажмите "Manual Deploy" → "Deploy latest commit"

### Подключение к базе данных

```bash
psql <Internal Database URL из Render Dashboard>
```