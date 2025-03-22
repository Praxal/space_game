#!/bin/bash

# Check if IP address is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide the VM IP address"
    echo "Usage: ./deploy.sh <vm-ip>"
    echo "Example: ./deploy.sh 123.456.789.0"
    exit 1
fi

VM_IP=$1

echo "🚀 Starting deployment to VM at $VM_IP..."

# SSH into the VM and run deployment commands
echo "🔄 Connecting to VM and deploying..."
ssh -t praxal@$VM_IP "cd ~/space_game && \
    echo '📥 Stashing any local changes...' && \
    git stash && \
    echo '📥 Pulling latest changes from GitHub...' && \
    git pull origin main && \
    echo '🔨 Building and restarting Docker containers...' && \
    sudo docker compose down && \
    sudo docker compose up -d --build && \
    echo '🔍 Checking container status...' && \
    sudo docker ps | grep space-game && \
    echo '✅ Deployment completed successfully!'"

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "🎉 Local deployment script completed" 