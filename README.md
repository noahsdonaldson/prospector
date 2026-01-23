# Prospector - AI Account Research Tool with Data Persistence

A containerized application that generates comprehensive 7-step account intelligence reports using LLM APIs (Claude or GPT-4) with real-time web search integration and PostgreSQL database for tracking research history.

## 🎯 What It Does

Prospector automates strategic account research for B2B sales teams. Enter a company name, and it generates:
- Strategic objectives and initiatives with **industry classification**
- Business unit analysis
- AI use case opportunities
- Key decision-maker personas with names
- Value realization mapping
- Personalized outreach emails

**New: Data Persistence**
- All research automatically saved to PostgreSQL database
- Track research history and staleness (last updated dates)
- View all companies with industry categorization
- Compare personas across reports
- Add custom personas for targeted research

Results include professionally formatted tables with markdown rendering and PDF export capabilities.

## 🌐 Real-Time Data Integration

**Tavily Search Integration** (Optional): 
- Fetches real-time web data for 2024-2026 information
- Performs targeted searches for executive names and current initiatives
- 1,000 free searches/month at [tavily.com](https://tavily.com)
- Falls back to LLM knowledge if API key not provided

**LLM Training Data**:
- Claude Sonnet 4: up to early 2024
- GPT-4o: up to October 2023

For best results, provide a Tavily API key to ensure current data.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                      http://localhost:3000                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 │ HTTP/SSE
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                            │
│  • Chakra UI with custom styling                                │
│  • Real-time progress streaming                                 │
│  • Markdown table rendering                                     │
│  • PDF export (jsPDF)                                           │
│  • API key management (LLM + Tavily)                            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 │ POST /api/research
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│                  http://localhost:8000                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Research Orchestrator (research.py)              │   │
│  │  • Executes 7 sequential steps                          │   │
│  │  • Streams progress updates via SSE                     │   │
│  │  • Validates results and retries if needed              │   │
│  └──────────┬──────────────────────────────┬────────────────┘   │
│             │                              │                    │
│             ▼                              ▼                    │
│  ┌──────────────────┐         ┌─────────────────────────┐      │
│  │  Tavily Search   │         │    LLM Client           │      │
│  │  (Optional)      │         │  (llm_client.py)        │      │
│  │                  │         │  • Claude Sonnet 4      │      │
│  │ • Multi-targeted │         │  • GPT-4o               │      │
│  │   executive      │         │  • Structured output    │      │
│  │   searches       │         │    support              │      │
│  │ • 6 C-suite      │         └────────────┬────────────┘      │
│  │   role queries   │                      │                   │
│  │ • Result         │                      │                   │
│  │   validation     │                      │                   │
│  └──────────────────┘                      │                   │
│                                            │                   │
└────────────────────────────────────────────┼───────────────────┘
                                             │
                                             │ API Calls
                                             ▼
                              ┌──────────────────────────┐
                              │   External APIs          │
                              │                          │
                              │  • Anthropic API         │
                              │  • OpenAI API            │
                              │  • Tavily Search API     │
                              └──────────────────────────┘
```

## 🔄 Research Flow

```
START
  │
  ├─→ [1] Strategic Objectives
  │    ├─ Tavily: "company strategic objectives 2024 2025"
  │    └─ LLM: Analyze & structure
  │
  ├─→ [2] Business Unit Alignment
  │    ├─ Tavily: "company business units divisions 2024"
  │    └─ LLM: Map BUs to strategy
  │
  ├─→ [3] BU Deep-Dive (for each BU)
  │    ├─ Tavily: "company [BU_name] operations 2024"
  │    └─ LLM: Detailed BU analysis
  │
  ├─→ [4] AI Alignment
  │    ├─ Tavily: "company AI initiatives 2024"
  │    └─ LLM: Map AI use cases to objectives
  │
  ├─→ [5] Persona Mapping ⭐ ENHANCED
  │    ├─ Tavily Multi-Search:
  │    │   • "company CFO name 2024"
  │    │   • "company CTO name 2024"
  │    │   • "company COO name 2024"
  │    │   • + CRO, CDO, CISO
  │    ├─ LLM: Create persona table with names
  │    ├─ Validation: Check for TBD/empty names
  │    └─ Retry if validation fails (with stronger prompt)
  │
  ├─→ [6] Value Realization
  │    └─ LLM: Use Step 5 personas for value mapping
  │
  └─→ [7] Outreach Email
       └─ LLM: Generate personalized outreach
  
END → Results with tables, names, metrics
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- API key from either:
  - [Anthropic](https://console.anthropic.com) (Claude)
  - [OpenAI](https://platform.openai.com) (GPT-4)
- **Optional**: [Tavily API key](https://tavily.com) for real-time web search (1,000 free searches/month)

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
3. Enter your LLM API key
4. **(Optional)** Enter your Tavily API key for real-time web data
5. Click "Start Prospecting"
6. Wait 5-10 minutes while the tool runs all 7 steps
7. Browse results in tabbed interface
8. Download as PDF

## ✨ Key Features

- **Real-time Progress Streaming**: See each step complete as it happens
- **Markdown Table Rendering**: Clean, formatted tables in the UI
- **PDF Export**: Download research as professionally formatted PDF
- **Executive Name Discovery**: Multi-search validation finds actual decision-maker names
- **Automatic Retry Logic**: Validates persona data and retries if names missing
- **Clean HTML/Markdown Stripping**: Tables and PDFs show clean text without markup
- **Grey Color Scheme**: Professional, easy-to-read interface

## 📊 The 7-Step Research Process

1. **Strategic Objectives** - Company's current strategic priorities and initiatives (with web search)
2. **Business Unit Alignment** - Map business units to strategic objectives (with web search)
3. **BU Deep-Dive** - Detailed analysis of each business unit's operations (with web search per BU)
4. **AI Alignment** - Identify AI use cases aligned to objectives (with web search)
5. **Persona Mapping** - Key decision makers with actual names and titles (multi-targeted executive search + validation)
6. **Value Realization** - Quantifiable value propositions mapped to personas
7. **Outreach Email** - Personalized outreach templates

Each step streams progress updates in real-time, and results are displayed in formatted tables with markdown support.

## 💰 Cost Estimate

**Per full research report (with Tavily):**
- **Claude Sonnet 4**: ~$1-3 per company (LLM) + free Tavily searches
- **GPT-4o**: ~$2-4 per company (LLM) + free Tavily searches

**Without Tavily**: Same LLM costs, but uses training data instead of real-time web results

The tool makes 7+ LLM API calls per company (more if there are multiple business units in Step 3), plus 10-15 Tavily searches if enabled.

## 📁 Project Structure

```
prospector/
├── docker-compose.yml          # Orchestrates all 3 containers (db, backend, frontend)
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt        # Python deps (FastAPI, httpx, tavily, SQLAlchemy, psycopg2)
│   ├── main.py                 # FastAPI server with SSE + database endpoints
│   ├── research.py             # 7-step orchestrator with validation + metadata
│   ├── llm_client.py           # LLM API client (Claude/GPT-4)
│   ├── search_client.py        # Tavily search integration
│   ├── prompts.py              # All 7 prompt templates with industry extraction
│   ├── database.py             # SQLAlchemy models (Company, Report, Persona, Queue)
│   ├── parsers.py              # Robust persona table parsing + industry extraction
│   └── init.sql                # PostgreSQL schema initialization
└── frontend/
    ├── Dockerfile
    ├── package.json            # React, Chakra UI, jsPDF
    ├── public/
    │   ├── index.html
    │   └── images/
    │       └── prospector-ls.png  # Background image
    └── src/
        ├── index.js
        ├── index.css           # Google Fonts (Montserrat)
        └── App.js              # React UI with auto-save to database
```

## 🗄️ Database & API Endpoints

**PostgreSQL Database** (port 5432):
- `companies` - Company records with industry classification
- `reports` - Research reports with all 7 steps as JSONB
- `personas` - Extracted decision-makers (auto + manual)
- `research_queue` - Queue for manually added persona research

**API Endpoints**:
- `POST /api/research` - Run research (streaming SSE response)
- `POST /api/research/save` - Save completed research to database
- `GET /api/companies` - List all companies with metadata
- `GET /api/companies/{id}/reports` - Get research history for company
- `GET /api/reports/{id}` - Get full report with personas
- `POST /api/personas` - Manually add persona for research
- `GET /api/companies/{id}/personas` - Get all personas for company

**Data Tracked**:
- Research duration, token usage, cost estimates
- Industry vertical (Healthcare, Tech, Financial Services, etc.)
- Last researched date for staleness detection
- Persona source (auto-discovered vs manually added)
- Research status (in_progress, complete, failed)

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

### Tavily (Optional - for real-time web search)

1. Go to https://tavily.com
2. Sign up for free account
3. Get your API key from dashboard
4. 1,000 free searches per month
5. Copy the key (starts with `tvly-...`)

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

Possible additions once the core workflow is validated:

- [ ] **Database** (PostgreSQL): Store research results for later reference
- [ ] **User Authentication**: Multi-user support with login
- [ ] **Analytics Dashboard**: Usage metrics and insights
- [ ] **Export to PowerPoint**: Auto-generate sales decks
- [ ] **CRM Integration**: Link to Salesforce opportunities
- [ ] **Caching**: Store public company data to reduce API costs
- [ ] **Batch Processing**: Research multiple companies at once
- [ ] **Email Integration**: Send reports via email
- [ ] **Custom Prompts**: Allow users to customize research steps
- [ ] **Agent-Based Research**: Let AI decide when/what to search (currently deterministic)
- [ ] **LinkedIn Integration**: Auto-fetch executive profiles
- [ ] **News Monitoring**: Alert when target companies make strategic announcements

## 🎯 Design Decisions

**Why not use agents/tool calling?**
- Current sequential pipeline is deterministic and debuggable
- 7-step flow is well-structured and covers the use case
- Multi-search + validation achieves similar results with less complexity
- Cost/latency predictable (7-8 LLM calls vs. 20-30 with agents)
- Prompts and searches can be refined without architectural changes

**When to consider agents**: If users need dynamic research depth (some companies need 3 searches, others need 50), or if adding 50+ tools/data sources.

## 📈 Recent Improvements

- **Tavily Integration**: Real-time web search for current data (Jan 2026)
- **Multi-targeted Executive Search**: 6 separate searches for C-suite names
- **Validation & Retry Logic**: Automatically retries if names not found
- **PDF Export**: Professional formatting with tables, headers, bullets
- **Markdown Stripping**: Clean HTML/markdown removal from tables
- **Structured Output Support**: JSON schema enforcement ready (not yet active)

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
