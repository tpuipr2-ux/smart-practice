#!/bin/bash
set -e

echo "Starting deployment of Smart Practice application..."

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example. Fill required variables and run again."
    exit 1
  else
    echo "ERROR: .env file is missing"
    exit 1
  fi
fi

set -a
source .env
set +a

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo "ERROR: docker compose is not installed"
  exit 1
fi

for var in DOMAIN WEB_APP_URL REACT_APP_API_URL BOT_TOKEN REACT_APP_BOT_USERNAME; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var is empty in .env"
    exit 1
  fi
done

mkdir -p certbot/conf certbot/www

echo "Stopping previous containers (if any)..."
$COMPOSE_CMD down --remove-orphans || true

issue_certificate() {
  if [ -z "$LETSENCRYPT_EMAIL" ]; then
    return 1
  fi

  echo "Issuing Let's Encrypt certificate for $DOMAIN ..."
  docker run --rm -p 80:80 \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot:latest certonly --standalone \
    --non-interactive --agree-tos --no-eff-email \
    --email "$LETSENCRYPT_EMAIL" -d "$DOMAIN"
}

if [ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ] || [ ! -f "certbot/conf/live/$DOMAIN/privkey.pem" ]; then
  echo "No existing certificate for $DOMAIN"
  if ! issue_certificate; then
    echo "WARNING: Let's Encrypt not configured. Generating temporary self-signed certificate..."
    mkdir -p "certbot/conf/live/$DOMAIN"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "certbot/conf/live/$DOMAIN/privkey.pem" \
      -out "certbot/conf/live/$DOMAIN/fullchain.pem" \
      -subj "/CN=$DOMAIN"
  fi
fi

echo "Building and starting Docker containers..."
$COMPOSE_CMD up --build -d --remove-orphans

if [ -n "$BOT_TOKEN" ] && [ -n "$WEB_APP_URL" ]; then
  echo "Configuring Telegram webhook and menu button..."
  curl -fsS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -d "url=${WEB_APP_URL}/bot${BOT_TOKEN}" >/dev/null || true

  curl -fsS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
    -H "Content-Type: application/json" \
    -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"Open Smart Practice\",\"web_app\":{\"url\":\"${WEB_APP_URL}\"}}}" >/dev/null || true
fi

echo "Deployment completed."
echo "Public URL: https://$DOMAIN"
