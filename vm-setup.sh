#!/bin/bash
#
# Thesis Engine VM Setup
# One-command installation for $5 VM (Ubuntu 22.04)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/sovereignangel/sovereignangel.github.io/master/vm-setup.sh | bash
#

set -e

echo "🚀 Setting up Thesis Engine on VM..."

# Update system
echo "📦 Updating system..."
apt-get update
apt-get upgrade -y

# Install PostgreSQL
echo "🗄️  Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
echo "📊 Setting up database..."
sudo -u postgres psql <<EOF
CREATE DATABASE thesis_engine;
CREATE USER thesis_user WITH ENCRYPTED PASSWORD 'change_this_password';
GRANT ALL PRIVILEGES ON DATABASE thesis_engine TO thesis_user;
\c thesis_engine
GRANT ALL ON SCHEMA public TO thesis_user;
EOF

# Install Node.js 20
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
echo "⚙️  Installing PM2..."
npm install -g pm2

# Install Nginx
echo "🌐 Installing Nginx..."
apt-get install -y nginx

# Install Git
apt-get install -y git

# Clone repository
echo "📥 Cloning repository..."
cd /opt
git clone https://github.com/sovereignangel/sovereignangel.github.io.git thesis-engine
cd thesis-engine

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local template
echo "📝 Creating environment file..."
cat > .env.local <<EOF
# Database (Local PostgreSQL)
DATABASE_URL=postgresql://thesis_user:change_this_password@localhost:5432/thesis_engine

# Groq API
GROQ_API_KEY=

# Garmin
GARMIN_EMAIL=
GARMIN_PASSWORD=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_REFRESH_TOKEN=

# Chess.com
CHESS_COM_USERNAME=

# Stripe
STRIPE_SECRET_KEY=

# GitHub
GITHUB_TOKEN=
GITHUB_USERNAME=

# Wave.ai + Dropbox
DROPBOX_ACCESS_TOKEN=
WAVE_AI_FOLDER_PATH=/Apps/Wave/transcripts

# Cron Security
CRON_SECRET=$(openssl rand -base64 32)
EOF

echo "✏️  Please edit /opt/thesis-engine/.env.local and add your API keys"
echo ""

# Run database migration
echo "🗄️  Running database migrations..."
# Will prompt to edit .env.local first
read -p "Press enter after you've added your API keys to /opt/thesis-engine/.env.local..."

# Install PostgreSQL client for Node
npm install pg

# Run schema
echo "📊 Setting up database schema..."
PGPASSWORD=change_this_password psql -h localhost -U thesis_user -d thesis_engine -f supabase/schema.sql

# Build app
echo "🔨 Building application..."
npm run build

# Setup PM2
echo "⚙️  Setting up PM2..."
pm2 start npm --name "thesis-engine" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# Setup Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/thesis <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/thesis /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Setup systemd timers for cron jobs
echo "⏰ Setting up cron jobs..."

# Daily sync at 5am
cat > /etc/systemd/system/thesis-sync.service <<EOF
[Unit]
Description=Thesis Engine Daily Sync

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X GET http://localhost:3000/api/cron/sync-daily -H "Authorization: Bearer \$(grep CRON_SECRET /opt/thesis-engine/.env.local | cut -d '=' -f2)"
EOF

cat > /etc/systemd/system/thesis-sync.timer <<EOF
[Unit]
Description=Run Thesis sync at 5am daily

[Timer]
OnCalendar=*-*-* 05:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Voice processing hourly
cat > /etc/systemd/system/thesis-voice.service <<EOF
[Unit]
Description=Thesis Engine Voice Processing

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X GET http://localhost:3000/api/cron/process-voice -H "Authorization: Bearer \$(grep CRON_SECRET /opt/thesis-engine/.env.local | cut -d '=' -f2)"
EOF

cat > /etc/systemd/system/thesis-voice.timer <<EOF
[Unit]
Description=Run Thesis voice processing hourly

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable timers
systemctl daemon-reload
systemctl enable thesis-sync.timer
systemctl enable thesis-voice.timer
systemctl start thesis-sync.timer
systemctl start thesis-voice.timer

# Setup log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/thesis <<EOF
/root/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF

echo ""
echo "✅ Thesis Engine setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit /opt/thesis-engine/.env.local with your API keys"
echo "2. Restart: pm2 restart thesis-engine"
echo "3. View logs: pm2 logs thesis-engine"
echo "4. Access at: http://YOUR_VM_IP"
echo ""
echo "🔐 To add SSL (optional):"
echo "   apt-get install certbot python3-certbot-nginx"
echo "   certbot --nginx -d your-domain.com"
echo ""
echo "📊 Cron jobs scheduled:"
echo "   - Daily sync: 5:00 AM"
echo "   - Voice processing: Every hour"
echo ""
echo "🎯 Cost: €4.15/month (Hetzner) or FREE (Oracle Cloud)"
