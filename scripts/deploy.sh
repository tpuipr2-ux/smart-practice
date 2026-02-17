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

    # Stop existing stack first to avoid port conflicts and stale/orphan containers
    echo "Stopping previous containers (if any)..."
    $COMPOSE_CMD down --remove-orphans || true
    
    # Build and start the services
    echo "Building and starting Docker containers..."
    $COMPOSE_CMD up --build -d --remove-orphans
    
    echo "Application deployed successfully!"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:3001"
    echo "Nginx: http://localhost:80"
fi
