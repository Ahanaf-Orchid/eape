# Deploy Guide — Hostinger KVM 4

**Created:** 2026-06-10
**Updated:** 2026-06-10 (Phase 11)

## Target Specs

- **Server**: Hostinger KVM 4
- **CPU**: 4 cores
- **RAM**: 16 GB
- **Disk**: 200 GB SSD
- **Bandwidth**: 16 TB
- **OS**: Ubuntu 22.04 (or latest LTS)

## Deployment Options

### Option A: Docker Compose (Recommended)

The project includes `Dockerfile`, `docker-compose.yml`, and `nginx.conf`.

#### On VPS (SSH in as root):

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Clone repo
git clone https://github.com/Ahanaf-Orchid/eape.git /opt/eape
cd /opt/eape

# Create data directory for SQLite persistence
mkdir -p data

# Copy production env (from /private/ on your local machine)
# scp private/env.production root@<vps-ip>:/opt/eape/.env.production

# Build and start
docker compose up -d --build

# Check logs
docker compose logs -f
```

#### On VPS via Hostinger MCP:

Use `hostinger_VPS_createNewProjectV1` with the GitHub repo URL:
- `virtualMachineId`: Your KVM 4 VM ID
- `project_name`: `eape`
- `content`: `https://github.com/<org>/eape`

### Option B: Direct Node.js

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Clone and build
git clone https://github.com/Ahanaf-Orchid/eape.git /opt/eape
cd /opt/eape
npm ci --omit=dev
npm run build

# Create data directory
mkdir -p data

# Copy env
cp .env.production .env.local

# Start (use PM2 for process management)
npm install -g pm2
pm2 start node_modules/.bin/next --name eape -- start -p 3000
pm2 save
pm2 startup
```

## Post-Deploy

### Nginx Reverse Proxy (if not using Docker nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL (Let's Encrypt)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### Database Backup

Add to crontab:
```bash
# Daily backup at 3 AM
0 3 * * * cp /opt/eape/data/eape.db /opt/backups/eape-$(date +\%Y\%m\%d).db
```

### Health Check

```bash
curl http://localhost:3000/
# Should return 200 with homepage HTML
```

## Firewall

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## Environment Variables (Production)

Set these on the VPS (via `.env.local` or Docker environment):

```
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<admin-password>
```

## Troubleshooting

| Issue | Check |
|-------|-------|
| Site won't start | `docker compose logs app` |
| API errors | Check `data/eape.db` exists and is writable |
| Admin login fails | Verify ADMIN_EMAIL/PASSWORD in env |
| Missing images | Ensure `public/shared/` SVGs are present |
| 502 Bad Gateway | Nginx can't reach Next.js — check port 3000 |
