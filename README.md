# 🚀 Railway Auto-Healer

AI-powered monitoring and auto-healing system for Railway applications using Claude AI.

![Railway Auto-Healer Dashboard](https://img.shields.io/badge/Railway-Auto--Healer-blue?style=for-the-badge&logo=railway)
![Claude AI](https://img.shields.io/badge/Claude-AI-orange?style=for-the-badge)
![GitHub Integration](https://img.shields.io/badge/GitHub-Integration-green?style=for-the-badge&logo=github)

## ✨ Features

- 🔍 **24/7 Railway App Monitoring** - Real-time error detection and status tracking
- 🤖 **Claude AI Integration** - Intelligent error analysis and solution generation  
- 🔧 **Automated Error Fixing** - Auto-healing for common issues with safety guards
- 📋 **Manual Approval Queue** - Complex fixes require human approval
- 🔄 **GitHub Integration** - Automatic PR creation and deployment
- 📊 **Beautiful Dashboard** - Real-time monitoring with Socket.io
- 🛡️ **Safety Features** - Rate limiting, confidence thresholds, rollback capabilities

## 🎯 Auto-Fixable Issues

- ✅ Missing environment variables
- ✅ Port conflicts (EADDRINUSE)
- ✅ Missing npm/yarn dependencies
- ✅ Build cache issues
- ✅ JSON configuration errors
- ✅ Simple deployment issues

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/ThinkBeDo/railway-auto-healer.git
cd railway-auto-healer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 4. Start Demo Mode
```bash
npm start
# Open http://localhost:3001
```

## 🔑 Required API Keys

| Service | How to Get | Required For |
|---------|------------|---------------|
| **Railway API** | [Railway Dashboard](https://railway.app/dashboard) → Account Settings → Public API | App monitoring |
| **Claude AI** | [Anthropic Console](https://console.anthropic.com/) → API Keys | Error analysis |
| **GitHub** | [GitHub Settings](https://github.com/settings/tokens) → Personal Access Tokens | Auto-fixes |

## 📊 Dashboard Preview

### Real-time Monitoring
- Live app status updates
- Error detection and classification
- Healing progress tracking
- System statistics

### Auto-Healing Workflow
1. **Error Detection** - Real-time monitoring catches issues
2. **AI Analysis** - Claude analyzes and provides solutions
3. **Safety Check** - Multiple safety guards validate fixes
4. **Auto-Fixing** - Safe errors get fixed immediately
5. **GitHub PR** - Complex fixes create pull requests
6. **Deployment** - Automatic redeployment after fixes

## 🛡️ Safety Features

- **Rate Limiting**: Maximum 5 auto-fixes per hour per app
- **Confidence Threshold**: 80% minimum confidence for auto-fixes
- **Manual Approval**: Critical errors require human review
- **Automatic Rollback**: Failed fixes get reverted immediately
- **Business Hours**: High-risk operations restricted to business hours

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Railway API   │───▶│  Auto-Healer    │───▶│   GitHub API    │
│   (Monitoring)  │    │   (Claude AI)   │    │  (Auto-fixes)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    Dashboard    │
                       │  (Socket.io)    │
                       └─────────────────┘
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|--------------|
| `/api/health` | GET | System health check |
| `/api/apps` | GET | List all monitored apps |
| `/api/apps/:id/status` | GET | Get app status |
| `/api/apps/:id/logs` | GET | Get app logs |
| `/api/apps/:id/heal` | POST | Trigger manual healing |
| `/api/stats` | GET | System statistics |

## 🚀 Deployment to Railway

### Option 1: One-Click Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/railway-auto-healer)

### Option 2: Manual Deploy
1. Push code to your GitHub
2. Connect Railway to your repository
3. Set environment variables in Railway dashboard
4. Deploy automatically!

## 🎯 Real-World Benefits

| Before Auto-Healer | After Auto-Healer |
|--------------------|-------------------|
| ❌ Manual error detection (hours/days) | ✅ Instant detection (real-time) |
| ❌ Client reports = downtime happened | ✅ Proactive fixing before clients notice |
| ❌ Manual debugging (2-4 hours) | ✅ Automated analysis (12 seconds) |
| ❌ Manual fixes and deployment | ✅ Automated PRs and deployment |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Railway](https://railway.app/) for excellent hosting platform
- [Anthropic](https://anthropic.com/) for Claude AI
- [GitHub](https://github.com/) for version control and automation

---

**🎉 Your Railway apps can now heal themselves!**

*Built with ❤️ by [Tyler LaFleur](https://github.com/ThinkBeDo)*
