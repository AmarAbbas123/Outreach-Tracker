# 🔗 Outreach Tracker

> A full-stack web app to manage link-building outreach from one place — prospects, emails, follow-ups, pipeline, and won links — with AI-assisted email writing and reply sorting.

---

## ✨ Features

- **Clients & Campaigns** — organise work by client and goal
- **Prospect Database** — store websites and contacts, import from CSV, detect duplicates
- **Pipeline Board** — drag prospects through stages from *New* to *Link Live*
- **Email Templates** — reusable templates with variables like `{{name}}` and `{{domain}}`
- **Follow-up Sequences** — automatic reminders if there is no reply
- **Task Reminders** — daily list of what to do today and what is overdue
- **Won Links Tracker** — record each link, its cost, and check it is still live
- **Reports** — replies, conversions, cost per link, campaign progress
- **AI Features** — email writer, reply sorter, prospect scoring *(Phase 2)*

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend *(coming)* | Node.js, Express |
| Database *(coming)* | MongoDB |
| Auth *(coming)* | JWT |
| Email *(coming)* | Gmail API / SMTP |
| Background Jobs *(coming)* | BullMQ + Redis |
| AI *(coming)* | Claude API |

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/outreach-tracker.git
cd outreach-tracker

# Install dependencies
npm install

# Start the dev server
npm run dev
```

App runs at **http://localhost:5173**

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/       # Sidebar, Topbar, Layout wrapper
│   └── ui/           # Shared UI components
└── pages/            # One file per route
    ├── Dashboard.jsx
    ├── Clients.jsx
    ├── Campaigns.jsx
    ├── Prospects.jsx
    ├── Pipeline.jsx
    ├── Templates.jsx
    ├── Tasks.jsx
    ├── Links.jsx
    ├── Reports.jsx
    └── Login.jsx
```

## 🗺 Build Phases

| Phase | Scope |
|---|---|
| **1 — MVP** | Login, clients, campaigns, prospects, pipeline, templates, tasks, links log, dashboard |
| **2 — Email & AI** | Gmail sending, reply sync, sequences, AI email writer, reply sorter |
| **3 — Advanced AI** | Outreach agent, semantic search, scoring, ask bar, link health checks |
| **4 — Growth** | Teams, Chrome extension, MCP server, billing |

## ⚖️ Rules

- AI-written emails are **never sent without user approval**
- API keys live on the server only — never exposed to the client
- Each account's data is strictly isolated

---

> **Status:** Phase 1 — MVP in progress
