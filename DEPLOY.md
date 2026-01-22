# 🚀 Deployment Guide

## Quick Local Deployment (5 Minutes)

### Step 1: Verify Prerequisites

```bash
# Check Docker is installed and running
docker --version
docker-compose --version

# If not installed, download Docker Desktop:
# macOS/Windows: https://www.docker.com/products/docker-desktop
# Linux: https://docs.docker.com/engine/install/
```

### Step 2: Navigate to Project

```bash
cd /Users/nodonald/prospector
```

### Step 3: Start the Application

```bash
# Build and start both containers
docker-compose up --build
```

**Expected output:**
```
[+] Building ...
[+] Running 2/2
 ✔ Container prospector-backend-1   Started
 ✔ Container prospector-frontend-1  Started
```

**Wait for these messages:**
- Backend: `Application startup complete` (usually ~30 seconds)
- Frontend: `webpack compiled successfully` (usually ~60-90 seconds)

### Step 4: Access the Application

Open your browser to: **http://localhost:3000**

### Step 5: Run Your First Research

1. Enter a company name: `Microsoft`
2. Select provider: `Anthropic (Claude)`
3. Paste your API key
4. Click **Start Research**
5. Watch the progress bar (5-10 minutes)
6. Browse results in tabs

---

## 🛑 Stopping the Application

```bash
# In the terminal where docker-compose is running:
Press Ctrl+C

# OR in a new terminal:
cd /Users/nodonald/prospector
docker-compose down
```

---

## 🔧 Troubleshooting

### Port Already in Use

If you see `port is already allocated`:

```bash
# Check what's using port 8000 or 3000
lsof -i :8000
lsof -i :3000

# Kill the process
kill -9 <PID>

# OR change ports in docker-compose.yml:
# For backend: "8001:8000"
# For frontend: "3001:3000"
```

### Docker Out of Space

```bash
# Clean up old containers and images
docker system prune -a -f

# Then rebuild
docker-compose up --build
```

### Frontend Can't Connect to Backend

```bash
# Check both containers are running
docker-compose ps

# Should show:
# prospector-backend-1   running   0.0.0.0:8000->8000/tcp
# prospector-frontend-1  running   0.0.0.0:3000->3000/tcp

# Test backend directly
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Changes Not Reflecting

```bash
# Rebuild with no cache
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 🌐 Cloud Deployment Options

### Option 1: AWS (Elastic Container Service)

**Prerequisites:**
- AWS Account
- AWS CLI installed
- ECR repositories created

```bash
# 1. Build and tag images
docker build -t account-research-backend ./backend
docker build -t account-research-frontend ./frontend

# 2. Tag for ECR
docker tag account-research-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/account-research-backend:latest
docker tag account-research-frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/account-research-frontend:latest

# 3. Push to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/account-research-backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/account-research-frontend:latest

# 4. Deploy to ECS via AWS Console or CLI
```

**Cost estimate:** ~$50-100/month (Fargate with 2 tasks)

### Option 2: Google Cloud Run

**Prerequisites:**
- Google Cloud Account
- gcloud CLI installed

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project <project-id>

# 2. Build and deploy backend
cd backend
gcloud run deploy account-research-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# 3. Build and deploy frontend (update backend URL in App.js first)
cd ../frontend
gcloud run deploy account-research-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Cost estimate:** ~$10-30/month (pay per use)

### Option 3: DigitalOcean App Platform

**Prerequisites:**
- DigitalOcean Account
- GitHub repository with your code

```bash
# 1. Push code to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main

# 2. Connect to DigitalOcean App Platform via UI
# - Go to https://cloud.digitalocean.com/apps
# - Click "Create App"
# - Connect GitHub repository
# - Auto-detect Dockerfiles
# - Deploy
```

**Cost estimate:** ~$25-50/month (2 containers, basic tier)

### Option 4: Railway.app (Easiest)

**Prerequisites:**
- Railway account
- GitHub repository

```bash
# 1. Push to GitHub (if not already done)
git init
git add .
git commit -m "Initial commit"
git push

# 2. Deploy via Railway UI
# - Go to https://railway.app
# - Click "New Project"
# - Select "Deploy from GitHub repo"
# - Railway auto-detects docker-compose.yml
# - Click Deploy
```

**Cost estimate:** ~$5-20/month (hobby tier)

---

## 🔒 Production Security Checklist

Before deploying to production:

- [ ] Remove API keys from code (use environment variables)
- [ ] Add authentication/authorization
- [ ] Enable HTTPS/SSL
- [ ] Set up CORS properly (restrict origins)
- [ ] Add rate limiting
- [ ] Enable logging and monitoring
- [ ] Set up backup strategy (if adding database later)
- [ ] Configure firewall rules
- [ ] Use secrets management (AWS Secrets Manager, etc.)
- [ ] Add health checks and auto-restart policies

---

## 📊 Production docker-compose.yml

For production, create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - ENV=production
    restart: always
    # Remove volumes in production

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
    depends_on:
      - backend
    # Remove volumes in production

  # Optional: Add nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: always
```

Deploy with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📈 Monitoring (Optional)

Add monitoring with Prometheus and Grafana:

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly** with multiple companies
2. **Monitor costs** via LLM provider dashboards
3. **Collect feedback** from users
4. **Add features** based on usage patterns
5. **Scale** as needed (horizontal scaling with multiple containers)

---

**Need help?** Check the main [README.md](README.md) for more details.
