# KSP AI Crime Intelligence Platform

> **🏆 Karnataka State Police — AI Decision Intelligence Platform**
> Built for the State Police AI Hackathon

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](http://localhost:8765/index.html)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🚀 Overview

An enterprise-grade **AI-powered Crime Intelligence Platform** for Karnataka State Police, designed to help officers investigate crimes, discover criminal networks, predict crime trends, and make data-driven decisions in real time.

---

## ✨ Features

### 🎯 Core Intelligence
- **AI Crime Intelligence Dashboard** — Live KPI metrics, heatmap, trend charts, District Intelligence Grid
- **AI Investigation Workspace** — Drag-and-drop case builder with AI-powered analysis
- **Criminal Network Visualization** — Force-directed D3.js graph of criminal associations
- **Predictive Analytics** — ML-based crime forecasting with confidence intervals

### 🔍 Advanced Modules
| Module | Description |
|--------|-------------|
| Serial Crime Detection | Finds MO-linked case series across districts |
| Digital Footprint | 360° criminal profiling with timeline and network graph |
| Crime Cascade Simulation | Animated hotspot progression forecasting |
| Commander Briefing | Auto-generated daily intelligence report |
| Resource Allocation AI | AI-optimized patrol unit and budget deployment |
| Case Priority AI | Multi-factor risk scoring with explainable AI |
| Event Monitor | Crime risk prediction for festivals & events |
| AI Scenario Simulation | What-If intervention impact modeling |

### 🤖 AI Engine
- **Anomaly Detection** — Real-time spike and pattern detection
- **Decision Support** — Actionable recommendations with confidence scores
- **Explainable AI** — Every recommendation explained in plain language
- **AI Chat (CoPilot)** — Natural language querying of crime data

### 🏢 Enterprise Features
- JWT Authentication & Role-Based Access Control
- Audit Logs & Notification System
- PDF/Excel Report Export
- FastAPI Backend + PostgreSQL Database
- Docker Compose deployment ready

---

## 🛠️ Quick Start (Frontend Demo)

```bash
# Serve locally (Python)
python -m http.server 8765 --directory .

# Open browser
http://localhost:8765/index.html
```

## 🐳 Full Stack (Docker)

```bash
docker-compose up --build
```

---

## 📁 Project Structure

```
KSP/
├── index.html              # Main Dashboard
├── pages/                  # All feature pages (21 pages)
│   ├── investigation.html  # AI Investigation Workspace
│   ├── network.html        # Criminal Network Graph
│   ├── commander.html      # Commander Briefing
│   ├── serial-crimes.html  # Serial Crime Detection
│   └── ...
├── css/                    # Design system (core, layout, components)
├── js/                     # Core JS modules
│   ├── db.js               # 10,250-record mock crime database
│   ├── filter-engine.js    # Smart filter & aggregation engine
│   ├── risk-engine.js      # District risk scoring
│   └── enterprise/         # Auth, audit, notifications
├── ai/                     # AI modules
│   ├── prediction/         # Crime predictor
│   ├── anomaly/            # Anomaly detector
│   ├── network/            # Network intelligence
│   ├── decision/           # Decision support engine
│   ├── explainability/     # Explainable AI
│   └── report/             # Report generator
└── backend/                # FastAPI + PostgreSQL backend
```

---

## 🧠 Technology Stack

**Frontend:** HTML5, Vanilla CSS, JavaScript ES6+  
**Visualization:** Chart.js, Leaflet.js, D3.js  
**Backend:** FastAPI (Python), PostgreSQL, JWT  
**Infrastructure:** Docker, Nginx  
**AI/ML:** Custom JS AI engines (anomaly detection, prediction, network analysis)

---

## 👮 Built For

Karnataka State Police — State AI Hackathon  
**Team:** NITHINPRANAV010

---

## 📄 License

MIT License — See [LICENSE](LICENSE)
