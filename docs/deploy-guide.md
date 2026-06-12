# Deploy Guide — Ethereum Apes

**Updated:** 2026-06-12 (Phase 17)

## Quick Deploy (Code Update)

> **Credentials:** Read `/private/deploy-notes.md` for VPS IP, root password, and admin credentials.
> Never commit `/private/` — it is gitignored.

```bash
# 1. SSH into VPS
ssh root@<vps-ip>
# Password: see /private/deploy-notes.md

# 2. Backup database + uploads
mkdir -p /opt/backups
cp /opt/eape/data/eape.db /opt/backups/eape-$(date +%Y%m%d-%H%M).db
cp -r /opt/eape/public/uploads /opt/backups/uploads-$(date +%Y%m%d-%H%M)

# 3. Pull and rebuild (volumes preserve data)
cd /opt/eape
git pull origin master
docker compose up -d --build

# 4. Health check
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# Should return: 200
```

## Smoke Test Checklist

| # | Check | Command |
|---|-------|---------|
| 1 | Homepage | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/` |
| 2 | Campaign | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/campaign` |
| 3 | CheckNFTs | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/checknfts` |
| 4 | Contact | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/contact` |
| 5 | Leaderboard | `curl -s "http://localhost:3000/api/leaderboard?tab=referrers"` |
| 6 | Config API | `curl -s http://localhost:3000/api/config/public | head -c 100` |
| 7 | Data route 410 | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/data/users` |
| 8 | Admin panel | Visit `https://ethereumapes.com/connectadmin` in browser |

## VPS Specs

- **Provider:** Hostinger KVM 4
- **IP:** `187.124.228.170` (see `/private/deploy-notes.md`)
- **OS:** Ubuntu 24.04 LTS
- **CPU:** 4 cores / **RAM:** 16 GB / **Disk:** 200 GB SSD

## Architecture

```
GitHub (Ahanaf-Orchid/eape)
       │ git pull
       ▼
  /opt/eape/ on VPS
       │ docker compose up -d --build
       ▼
  Docker container (app:3000)
       │ proxy_pass
       ▼
  Host nginx :80/:443 → SSL (Let's Encrypt)
       │
       ▼
  https://ethereumapes.com
```

## Docker Volumes (Persist Across Deploys)

| Volume | Path | Content |
|--------|------|---------|
| Database | `./data:/app/data` | `eape.db` — user data, config, claims |
| Uploads | `./public/uploads:/app/public/uploads` | Admin-uploaded images |

## Initial VPS Setup (First Time Only)

```bash
ssh root@<vps-ip>

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Clone repo
git clone https://github.com/Ahanaf-Orchid/eape.git /opt/eape
cd /opt/eape

# Create directories
mkdir -p data public/uploads

# Set environment variables
echo 'ADMIN_EMAIL=<email>' > .env
echo 'ADMIN_PASSWORD=<password>' >> .env

# Build and start
docker compose up -d --build
```

## Rollback

```bash
ssh root@<vps-ip>
cd /opt/eape
cp /opt/backups/eape-<timestamp>.db data/eape.db
cp -r /opt/backups/uploads-<timestamp>/* public/uploads/
docker compose up -d --build
```

## Docker Commands (on VPS)

```bash
docker compose ps              # Container status
docker compose logs -f         # Stream logs
docker compose logs --tail 50  # Last 50 lines
docker compose restart         # Restart container
docker compose down            # Stop container
```

## SSL (Let's Encrypt)

Already configured on host nginx:

```bash
# Renew certificate
certbot renew
# Check status
certbot certificates
```

## Database Backup Cron

```
# Daily at 3 AM
0 3 * * * cp /opt/eape/data/eape.db /opt/backups/eape-$(date +\%Y\%m\%d).db
```

## Troubleshooting

| Issue | Check |
|-------|-------|
| Site won't start | `docker compose logs app` on VPS |
| API errors | `data/eape.db` exists and is writable |
| Admin login fails | Verify ADMIN_EMAIL/PASSWORD in `.env` or `docker-compose.yml` |
| 502 Bad Gateway | Nginx can't reach container — check `docker compose ps` |
| Container won't build | Check disk space: `df -h` |
