# ⚡ Quick Start Guide

## Get Running in 2 Minutes

### 1. Start Docker Desktop
Make sure Docker Desktop is running on your Mac.

### 2. Launch the Application

```bash
cd /Users/nodonald/prospector
docker-compose up --build
```

### 3. Wait for Startup
- **Backend ready** when you see: `Application startup complete`
- **Frontend ready** when you see: `webpack compiled successfully`

### 4. Open Browser
Go to: **http://localhost:3000**

### 5. Run a Test
- Company: `Microsoft`
- Provider: `Anthropic (Claude)` or `OpenAI (GPT-4)`
- API Key: Paste your key
- Click: **Start Research**

---

## Current Project Structure

```
prospector/
├── README.md                    # Full documentation
├── DEPLOY.md                    # Deployment guide
├── QUICKSTART.md               # This file
├── docker-compose.yml          # Orchestration config
├── .gitignore                  # Git ignore rules
├── cleanup.sh                  # Remove old reference files
│
├── backend/                    # Python FastAPI server
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                # API endpoints
│   ├── research.py            # 7-step orchestrator
│   ├── llm_client.py          # LLM API client
│   └── prompts.py             # All 7 prompts
│
└── frontend/                   # React application
    ├── Dockerfile
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js             # Main React component
        ├── index.js           # Entry point
        └── index.css          # Styles

Total: 14 core files (clean and organized!)
```

---

## What Each Component Does

### Backend Files
- **main.py**: FastAPI server with `/api/research` endpoint
- **research.py**: Orchestrates all 7 research steps sequentially
- **llm_client.py**: Handles API calls to Claude/GPT-4
- **prompts.py**: Contains all 7 detailed prompt templates

### Frontend Files
- **App.js**: Full React UI with progress tracking and results display
- **index.js**: React entry point
- **index.css**: TailwindCSS for styling

---

## Common Commands

```bash
# Start application
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Rebuild after changes
docker-compose up --build

# Check container status
docker-compose ps

# Access backend directly
curl http://localhost:8000/health
```

---

## Testing the Setup

### Test 1: Backend Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

### Test 2: Backend Root
```bash
curl http://localhost:8000/
# Expected: {"status":"Account Research API is running"}
```

### Test 3: Frontend
Open browser: http://localhost:3000
Should see the Account Research Tool interface.

---

## Cleanup Old Reference Files

Once you verify everything works:

```bash
./cleanup.sh
```

This removes the old `backend_*.py`, `frontend_*.tsx` reference files.

---

## Cost Calculator

**Small Company** (3 business units):
- 7 base steps + 3 BU deep-dives = 10 LLM calls
- Claude Sonnet 4: ~$1-2
- GPT-4o: ~$2-3

**Large Company** (3 business units, complex):
- More tokens per response
- Claude Sonnet 4: ~$2-3
- GPT-4o: ~$3-5

**Monthly Usage** (10 companies/week):
- 40 companies × $2 average = **~$80/month**

---

## Next Steps

1. ✅ **Verify it works** - Run a test research on Microsoft
2. ✅ **Read full docs** - Check [README.md](README.md) for details
3. ✅ **Plan deployment** - Review [DEPLOY.md](DEPLOY.md) for cloud options
4. ✅ **Customize prompts** - Edit `backend/prompts.py` to refine research steps
5. ✅ **Add features** - See "Future Enhancements" in README.md

---

## Troubleshooting Quick Fixes

### "Port already in use"
```bash
lsof -i :8000
kill -9 <PID>
```

### "Cannot connect to Docker"
- Open Docker Desktop
- Wait for it to fully start
- Try again

### "Frontend won't load"
- Wait 60-90 seconds for webpack to compile
- Check logs: `docker-compose logs frontend`

### "API key invalid"
- Verify key is correct (no extra spaces)
- Check you have credits on Anthropic/OpenAI dashboard

---

**Questions?** Check the main [README.md](README.md) or [DEPLOY.md](DEPLOY.md).

**Ready to deploy?** Follow the [DEPLOY.md](DEPLOY.md) guide.
