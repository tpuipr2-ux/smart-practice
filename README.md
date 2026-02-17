# Smart Practice — единственная инструкция по запуску

1. Откройте файл `.env` и заполните только обязательные поля:
   - `BOT_TOKEN`
   - `REACT_APP_BOT_USERNAME`
   - `ADMIN_TG_ID`
   - `LETSENCRYPT_EMAIL`

   Остальные значения уже предзаполнены для домена `praktika.ond.tpu.ru`.

2. Убедитесь, что DNS домена `praktika.ond.tpu.ru` указывает на IP этого сервера, и что порты `80` и `443` открыты во внешнем firewall/security group.

3. Запустите автодеплой:

```bash
./scripts/deploy.sh
```

Скрипт автоматически:
- проверит `.env`;
- выпустит/обновит сертификат Let's Encrypt (или создаст временный сертификат);
- поднимет контейнеры через Docker Compose;
- настроит Telegram webhook и кнопку Mini App.

Проверка после запуска:
- `https://praktika.ond.tpu.ru`
- `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo`
