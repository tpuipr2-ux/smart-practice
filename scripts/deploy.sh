#!/bin/bash

# Deployment script for Smart Practice application

set -e  # Exit on any error

echo "Starting deployment of Smart Practice application..."

COMPOSE_CMD=""

# Check if we're running on Render
if [ "$RENDER" = "true" ]; then
    echo "Running on Render platform"

    # Render sets the PORT environment variable
    if [ -z "$PORT" ]; then
        echo "ERROR: PORT environment variable not set by Render"
        exit 1
    fi

    # For Render, we just need to start our services
    echo "Deployment completed successfully on Render!"
    exit 0
else
    echo "Running in local Docker environment"

    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        echo "ERROR: Docker is not installed"
        exit 1
    fi

    # Pick available compose command
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        echo "ERROR: docker-compose is not installed"
        exit 1
    fi

    # DOMAIN is required for HTTPS + Telegram Mini App
    if [ -z "$DOMAIN" ]; then
        echo "ERROR: DOMAIN is not set. Add DOMAIN to .env (example: praktika.ond.tpu.ru)"
        exit 1
    fi

    mkdir -p certbot/conf/live/$DOMAIN certbot/www

    # Bootstrap certificate so nginx can start before Let's Encrypt issue
    if [ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ] || [ ! -f "certbot/conf/live/$DOMAIN/privkey.pem" ]; then
        echo "No TLS certificate found. Generating temporary self-signed certificate for $DOMAIN..."
        openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
            -keyout certbot/conf/live/$DOMAIN/privkey.pem \
            -out certbot/conf/live/$DOMAIN/fullchain.pem \
            -subj "/CN=$DOMAIN"
    fi

    # Stop existing stack first to avoid port conflicts and stale/orphan containers
    echo "Stopping previous containers (if any)..."
    $COMPOSE_CMD down --remove-orphans || true

    # Build and start the services
    echo "Building and starting Docker containers..."
    $COMPOSE_CMD up --build -d --remove-orphans

    # Request/renew production certificate
    if [ -n "$LETSENCRYPT_EMAIL" ]; then
        echo "Requesting Let's Encrypt certificate for $DOMAIN..."
        $COMPOSE_CMD run --rm certbot certonly --webroot -w /var/www/certbot \
            --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email -d "$DOMAIN" || true
        $COMPOSE_CMD restart nginx || true
    else
        echo "WARNING: LETSENCRYPT_EMAIL is not set, skipping Let's Encrypt issue. HTTPS uses temporary self-signed certificate."
    fi

    # Configure Telegram webhook and menu button if credentials exist
    if [ -n "$BOT_TOKEN" ] && [ -n "$WEB_APP_URL" ]; then
        echo "Configuring Telegram webhook and Mini App button..."
        curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
          -d "url=${WEB_APP_URL}/bot${BOT_TOKEN}" > /dev/null || true

        curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
          -H "Content-Type: application/json" \
          -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"Открыть Smart Practice\",\"web_app\":{\"url\":\"${WEB_APP_URL}\"}}}" > /dev/null || true
    else
        echo "WARNING: BOT_TOKEN or WEB_APP_URL is empty, Telegram webhook/menu setup skipped."
    fi

    echo "Application deployed successfully!"
    echo "Frontend (direct): http://localhost:3000"
    echo "Backend (direct): http://localhost:3001"
    echo "Nginx HTTPS: https://$DOMAIN"
fi
