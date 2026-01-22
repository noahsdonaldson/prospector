# Account Research Tool

A containerized application that generates comprehensive 7-step account intelligence reports using LLM APIs (Claude or GPT-4).

## 🏗️ Architecture

- **Frontend**: React app (port 3000)
- **Backend**: FastAPI Python app (port 8000)
- **No database**: Each research run is stateless and fresh

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- API key from either:
  - [Anthropic](https://console.anthropic.com) (Claude)
  - [OpenAI](https://platform.openai.com) (GPT-4)

### 1. Start the Application

```bash
# Navigate to the project directory
cd prospector

# Start both containers
docker-compose up --build
```

This will:
1. Build the backend container
2. Build the frontend container
3. Start backend on http://localhost:8000
4. Start frontend on http://localhost:3000

### 2. Access the Tool

Open your browser to: **http://localhost:3000**

### 3. Generate Your First Report

1. Enter a company name (e.g., "JPMorgan Chase", "Microsoft")
2. Select your LLM provider (Anthropic or OpenAI)
3. Enter your API key
4. Click "Start Research"
5. Wait 5-10 minutes while the tool runs all 7 steps
6. Browse results in tabbed interface

## 📊 The 7-Step Research Process

1. **Strategic Objectives** - Company's current strategic priorities and initiatives
2. **Business Unit Alignment** - Map business units to strategic objectives
3. **BU Deep-Dive** - Detailed analysis of each business unit's operations
4. **AI Alignment** - Identify AI use cases aligned to objectives
5. **Persona Mapping** - Key decision makers and their priorities
6. **Value Realization** - Quantifiable value propositions
7. **Outreach Email** - Personalized outreach templates

## 💰 Cost Estimate

**Per full research report:**
- **Claude Sonnet 4**: ~$1-3 per company
- **GPT-4o**: ~$2-4 per company

The tool makes 7+ LLM API calls per company (more if there are multiple business units in Step 3).

## 📁 Project Structure

```
prospector/
├── docker-compose.yml          # Orchestrates both containers
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                 # FastAPI server
│   ├── research.py             # 7-step orchestrator
│   ├── llm_client.py           # LLM API client (Claude/GPT-4)
│   └── prompts.py              # All 7 prompt templates
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css
        └── App.js              # React UI component
```

## 🛠️ Development

### View Logs

```bash
# View all logs
docker-compose logs

# View backend logs only
docker-compose logs backend

# View frontend logs only
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

### Stop the Application

```bash
# Stop containers (Ctrl+C in terminal where docker-compose is running)
# OR
docker-compose down
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up --build
```

### Edit Code Without Rebuilding

The `docker-compose.yml` includes volume mounts, so changes to Python and JavaScript files will automatically reload:
- **Backend**: Changes to `.py` files reload automatically (uvicorn `--reload` flag)
- **Frontend**: Changes to `.js` files reload automatically (react-scripts hot reload)

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issue: Port 8000 already in use
# Solution: Kill the process or change port in docker-compose.yml
```

### Frontend can't connect to backend

```bash
# Verify both containers are running
docker-compose ps

# Test backend health
curl http://localhost:8000/health
```

### LLM API Errors

- **401 Unauthorized**: Check your API key is correct
- **429 Rate Limit**: You've hit API rate limits, wait a few minutes
- **Timeout**: Some steps take time (up to 60s per step), this is normal

### Docker Build Errors

```bash
# Clean up Docker cache and rebuild
docker-compose down
docker system prune -f
docker-compose up --build
```

## 🔑 Getting API Keys

### Anthropic (Claude)

1. Go to https://console.anthropic.com
2. Sign up / Log in
3. Navigate to "API Keys"
4. Create a new key
5. Copy the key (starts with `sk-ant-...`)

### OpenAI (GPT-4)

1. Go to https://platform.openai.com
2. Sign up / Log in
3. Navigate to "API Keys"
4. Create a new secret key
5. Copy the key (starts with `sk-...`)

## 🚢 Production Deployment

For production deployment, consider:

1. **Remove volume mounts** from `docker-compose.yml` (used for development hot-reload)
2. **Add environment variables** for API keys instead of user input
3. **Use nginx** as reverse proxy
4. **Add HTTPS** with SSL certificates
5. **Set up monitoring** (e.g., Prometheus, Grafana)
6. **Deploy to cloud**:
   - AWS: ECS or EKS
   - Google Cloud: Cloud Run or GKE
   - Azure: Container Instances or AKS
   - DigitalOcean: App Platform

## 🔮 Future Enhancements

Once the core workflow is validated, consider adding:

- [ ] **Database** (PostgreSQL): Store research results for later reference
- [ ] **User Authentication**: Multi-user support with login
- [ ] **Analytics Dashboard**: Usage metrics and insights
- [ ] **Export to PowerPoint**: Auto-generate sales decks
- [ ] **CRM Integration**: Link to Salesforce opportunities
- [ ] **Caching**: Store public company data to reduce API costs
- [ ] **Batch Processing**: Research multiple companies at once
- [ ] **Email Integration**: Send reports via email
- [ ] **Custom Prompts**: Allow users to customize research steps

## 📝 License

MIT - Use freely for your internal sales enablement.

## 🤝 Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify Docker is running
3. Ensure ports 3000 and 8000 are available
4. Check your API key is valid and has credits

---

**Built with**: FastAPI, React, Docker, Claude Sonnet 4, GPT-4
