#!/bin/bash
# ============================================
# SubTracker - EC2 One-Time Setup Script
# ============================================
# Run this ONCE after first SSH into EC2.
# After this, the app auto-starts on every boot.
#
# Usage:
#   chmod +x ec2-setup.sh
#   sudo ./ec2-setup.sh
# ============================================

set -e  # Exit on any error

echo "============================================"
echo "  SubTracker EC2 Setup — Starting..."
echo "============================================"

# ── 1. System Updates ──
echo ""
echo "[1/8] Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ── 2. Install Java 17 ──
echo ""
echo "[2/8] Installing Java 17..."
apt-get install -y openjdk-17-jdk-headless
java -version

# ── 3. Install Node.js 18 (for building frontend) ──
echo ""
echo "[3/8] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node -v && npm -v

# ── 4. Install Nginx + Maven ──
echo ""
echo "[4/8] Installing Nginx & Maven..."
apt-get install -y nginx maven git

# ── 5. Add swap (t2.micro only has 1GB RAM — Spring Boot needs more) ──
echo ""
echo "[5/8] Creating 2GB swap file (essential for t2.micro)..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap created and enabled."
else
    echo "Swap already exists, skipping."
fi
free -h

# ── 6. Clone & Build Backend ──
echo ""
echo "[6/8] Building Backend JAR..."
APP_DIR="/opt/subtracker"
mkdir -p $APP_DIR

# If code is already there (from scp/git), skip clone
if [ ! -d "$APP_DIR/subscription-tracker-backend" ]; then
    echo "  Cloning repository..."
    cd /opt
    git clone https://github.com/Aditya-Ubale/SubTracker.git subtracker
fi

cd $APP_DIR/subscription-tracker-backend
chmod +x mvnw
./mvnw clean package -DskipTests -q
cp target/*.jar $APP_DIR/backend.jar
echo "  Backend JAR built: $APP_DIR/backend.jar"

# ── 7. Build Frontend ──
echo ""
echo "[7/8] Building Frontend..."
cd $APP_DIR/subscription-tracker-frontend

# Set the API URL to point to this same EC2 instance
# Nginx will proxy /api to backend on port 8080
echo "VITE_API_URL=/api" > .env.production

npm install --legacy-peer-deps
npm run build
echo "  Frontend built to dist/"

# Copy frontend build to Nginx web root
rm -rf /var/www/subtracker
cp -r dist /var/www/subtracker
echo "  Frontend deployed to /var/www/subtracker"

# ── 8. Configure Nginx ──
echo ""
echo "[8/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/subtracker << 'NGINX_CONF'
server {
    listen 80;
    server_name _;
    root /var/www/subtracker;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/json application/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Reverse proxy: /api → Spring Boot on port 8080
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SPA fallback — serve index.html for all React routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_CONF

# Enable site, disable default
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/subtracker /etc/nginx/sites-enabled/subtracker
nginx -t && systemctl restart nginx
systemctl enable nginx
echo "  Nginx configured and enabled."

# ── 9. Create systemd service for backend (AUTO-START ON BOOT) ──
echo ""
echo "[✓] Creating systemd service for auto-start..."
cat > /etc/systemd/system/subtracker.service << 'SERVICE_CONF'
[Unit]
Description=SubTracker Spring Boot Backend
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/subtracker

# ─── Your app already has Neon DB defaults baked into application.properties ───
# ─── Only override what you need here: ───
Environment=PORT=8080
Environment=CORS_ORIGINS=*
Environment=FRONTEND_URL=*

ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /opt/subtracker/backend.jar
Restart=always
RestartSec=10

# Logging
StandardOutput=append:/var/log/subtracker.log
StandardError=append:/var/log/subtracker-error.log

[Install]
WantedBy=multi-user.target
SERVICE_CONF

systemctl daemon-reload
systemctl enable subtracker.service
systemctl start subtracker.service

echo ""
echo "============================================"
echo "  ✅ SubTracker EC2 Setup COMPLETE!"
echo "============================================"
echo ""
echo "  Frontend:  http://<YOUR-EC2-PUBLIC-IP>"
echo "  Backend:   http://<YOUR-EC2-PUBLIC-IP>/api/health"
echo ""
echo "  Auto-start: ENABLED (survives reboot)"
echo "    Stop/Start EC2 anytime — app restarts automatically."
echo ""
echo "  Useful commands:"
echo "    sudo systemctl status subtracker    # Check backend status"
echo "    sudo journalctl -u subtracker -f    # Live backend logs"
echo "    sudo tail -f /var/log/subtracker.log"
echo "    sudo systemctl restart subtracker   # Restart backend"
echo "    sudo systemctl restart nginx        # Restart frontend"
echo "============================================"
