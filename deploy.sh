#!/bin/bash

# Pull the latest changes from git
echo "Pulling latest changes from git..."
git pull origin main

# Rebuild and restart the Docker container
echo "Rebuilding and restarting Docker container..."
sudo docker compose down
sudo docker compose up -d --build

# Check if the container is running
echo "Checking container status..."
sudo docker ps | grep space-game

echo "Deployment complete!" 