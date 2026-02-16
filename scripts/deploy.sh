#!/bin/bash

# Deployment script for Smart Practice application

set -e  # Exit on any error

echo "Starting deployment of Smart Practice application..."

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
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        if ! command -v docker compose &> /dev/null; then
            echo "ERROR: docker-compose is not installed"
            exit 1
        fi
    fi
    
    # Build and start the services
    echo "Building and starting Docker containers..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up --build -d
    else
        docker compose up --build -d
    fi
    
    echo "Application deployed successfully!"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:3001"
    echo "Nginx: http://localhost:80"
fi