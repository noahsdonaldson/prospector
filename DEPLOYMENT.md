# Prospector Deployment Guide

## For the Project Owner (nodonald)

### Step 1: Push Images to Docker Hub

1. **Login to Docker Hub:**
   ```bash
   docker login
   ```

2. **Tag your images:**
   ```bash
   docker tag prospector-backend:latest nodonald/prospector-backend:latest
   docker tag prospector-frontend:latest nodonald/prospector-frontend:latest
   ```

3. **Push to Docker Hub:**
   ```bash
   docker push nodonald/prospector-backend:latest
   docker push nodonald/prospector-frontend:latest
   ```

### Step 2: Share with IT Person

Send your IT person:
- The `docker-compose.prod.yml` file
- The `.env.example` file
- This `DEPLOYMENT.md` file

---

## For the IT Person

### Prerequisites

- Docker Engine installed (version 20.10+)
- Docker Compose installed (version 2.0+)
- Server with open ports: 3000 (frontend), 8000 (backend), 5432 (database - optional if not exposing externally)

### Deployment Steps

#### 1. Create project directory on server:
```bash
mkdir -p /opt/prospector
cd /opt/prospector
```

#### 2. Copy files to server:
Transfer these files to `/opt/prospector`:
- `docker-compose.prod.yml`
- `.env.example`

#### 3. Configure environment:
```bash
# Copy the example and edit it
cp .env.example .env
nano .env  # or use vim/vi
```

**Important settings to change:**
- `POSTGRES_PASSWORD`: Set a strong, unique password
- `REACT_APP_API_URL`: Set to your server's public IP or domain
  - Example: `http://192.168.1.100:8000` or `https://api.yourdomain.com`

#### 4. Pull the latest images:
```bash
docker pull nodonald/prospector-backend:latest
docker pull nodonald/prospector-frontend:latest
docker pull postgres:16-alpine
```

#### 5. Start the application:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### 6. Verify deployment:
```bash
# Check all containers are running
docker ps

# Check logs
docker logs prospector-backend
docker logs prospector-frontend
docker logs prospector-db
```

#### 7. Access the application:
- Frontend: `http://your-server-ip:3000`
- Backend API: `http://your-server-ip:8000`
- API Docs: `http://your-server-ip:8000/docs`

### Management Commands

**Stop the application:**
```bash
docker-compose -f docker-compose.prod.yml down
```

**Restart the application:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

**Update to latest version:**
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

**View logs:**
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs -f prospector-backend
```

**Backup database:**
```bash
docker exec prospector-db pg_dump -U prospector prospector > backup_$(date +%Y%m%d).sql
```

**Restore database:**
```bash
cat backup_20260123.sql | docker exec -i prospector-db psql -U prospector -d prospector
```

### Firewall Configuration

If using a firewall, ensure these ports are open:
```bash
# Frontend (public access)
sudo ufw allow 3000/tcp

# Backend API (public access)
sudo ufw allow 8000/tcp

# PostgreSQL (only if external access needed - NOT recommended)
# sudo ufw allow 5432/tcp
```

### Troubleshooting

**Containers won't start:**
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Verify .env file exists and has correct values
- Ensure ports aren't already in use: `sudo netstat -tlnp | grep -E '3000|8000|5432'`

**Frontend can't connect to backend:**
- Verify `REACT_APP_API_URL` in `.env` matches your server setup
- Check backend is accessible: `curl http://localhost:8000/`
- May need to rebuild frontend with new API URL

**Database connection errors:**
- Wait for database health check: `docker logs prospector-db`
- Verify `POSTGRES_PASSWORD` matches in `.env`
- Check database is healthy: `docker exec prospector-db pg_isready -U prospector`

### Security Recommendations

1. **Use strong passwords** for `POSTGRES_PASSWORD`
2. **Don't expose PostgreSQL port** (5432) externally unless necessary
3. **Use HTTPS** in production (consider nginx reverse proxy with SSL)
4. **Regular backups** of the database
5. **Update images regularly** for security patches
6. **Restrict Docker Hub access** if repository contains sensitive data

### Production Considerations

For a production environment, consider:
- Using a reverse proxy (nginx/traefik) with SSL certificates
- Setting up automated backups
- Implementing monitoring (Prometheus, Grafana)
- Using Docker secrets for sensitive data
- Implementing log rotation
- Setting resource limits in docker-compose

### Support

For issues or questions, contact the project owner: nodonald
