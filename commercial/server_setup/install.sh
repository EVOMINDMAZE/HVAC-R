#!/bin/bash

# ThermoNeural Server Setup Script
# Usage: ./install.sh <domain> <email>
# Example: ./install.sh automation.thermoneural.com admin@thermoneural.com

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./install.sh <full-domain> <email>"
    echo "Example: ./install.sh n8n.mycompany.com me@gmail.com"
    exit 1
fi

echo "🚀 Starting Installation for $DOMAIN..."

# 1. Update System
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker & Docker Compose
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 2.5. Create Swap File (Critical for 1GB RAM Servers)
if [ ! -f /swapfile ]; then
    echo "💾 Creating 2GB Swap File..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap Created."
else
    echo "✅ Swap already exists."
fi

# 3. Create Docker Volume
docker volume create n8n_data

# 4. Configure .env
echo "📝 Configuring Environment..."
# Split domain into subdomain and root (simple assumption for standard inputs)
# Actually, the docker-compose expects separate vars, let's fix the .env dynamically
# For simplicity, we will just write the vars directly to .env

cat > .env <<EOF
DOMAIN_NAME=$(echo $DOMAIN | cut -d. -f2- )
SUBDOMAIN=$(echo $DOMAIN | cut -d. -f1)
SSL_EMAIL=$EMAIL
GENERIC_TIMEZONE=America/New_York
EOF

# 5. Start Services
echo "🚀 Launching n8n..."
docker compose up -d

echo "------------------------------------------------"
echo "✅ Installation Complete!"
echo "------------------------------------------------"
echo "🌍 Access n8n at: https://$DOMAIN"
echo "💡 First-time setup: Create your admin account immediately."
echo "------------------------------------------------"
