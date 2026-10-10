📚 Step 1: Documentation — Complete Content Management Guide
আমি এখন এই session-এর সব learning একটা comprehensive documentation file-এ লিখে দিচ্ছি। এটা docs/content-management.md file হবে।

📄 File: docs/content-management.md
markdown
# Content Management Guide

> **Quiz Program — Content API Architecture**
> Version: 1.0.0
> Last Updated: 2026-10-11
> Maintainer: Ariful Islam

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Content Workflow](#content-workflow)
3. [Command Cheatsheet](#command-cheatsheet)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Future Content Migration](#future-content-migration)
6. [Key Learnings](#key-learnings)

---

## 🏗️ Architecture Overview

### System Diagram
┌──────────────────────────────────────────────────────────────┐
│ GitHub Repository │
│ Ariful-Islam-bd/quiz-program (main branch) │
└──────────────────────┬───────────────────────────────────────┘
│
│ git push → webhooks
│
┌──────────────┴──────────────┐
│ │
↓ ↓
┌───────────────────┐ ┌───────────────────┐
│ Render │ │ Cloudflare │
│ (Backend API) │ │ (Frontend) │
│ │ │ │
│ quiz-program. │ │ quiz-program. │
│ onrender.com │ │ pages.dev │
└─────────┬─────────┘ └─────────┬─────────┘
│ │
│ API calls │ Serves JS/CSS/HTML
│ │
↓ │
┌───────────────────┐ │
│ MongoDB Atlas │ │
│ (Data Layer) │ │
│ │ │
│ 15+ contents │ │
│ User data │ │
└───────────────────┘ │
↑ │
│ │
│ Migration script │
│ (one-time / content update) │
│ │
┌─────────┴─────────┐ │
│ content/ │ │
│ (HTML source) │ │
│ (root level) │───────────────────┘
│ 56 files │
└───────────────────┘

text

### Component Roles

| Component | Location | Purpose |
|-----------|----------|---------|
| **`content/`** | Project root | HTML source files (development) |
| **`backend/scripts/migrate-content.js`** | Backend | Syncs HTML → MongoDB |
| **`backend/scripts/content-metadata.json`** | Backend | Mapping config (topicId, category, filePath) |
| **MongoDB Atlas** | Cloud | Runtime content storage |
| **Backend API** | Render | Serves content via REST |
| **Frontend** | Cloudflare Pages | UI + API client |
| **ContentService.js** | Frontend | API wrapper with caching |

### Data Flow
Developer edits HTML in content/
↓

Runs: npm run migrate:content
↓

Script reads content-metadata.json
↓

Reads HTML file, generates hash
↓

Compares hash with MongoDB
↓

Updates/Creates content document
↓

Frontend fetches via API: GET /api/v1/content/:topicId
↓

Content rendered in browser

text

---

## 🔄 Content Workflow

### Scenario 1: Edit Existing Content (HTML)

**When:** Updating an existing topic's HTML content

**Steps:**

```powershell
# 1. Edit HTML file in VSCode
code content/HSC/Math/3A/3A Q01-Q02 Solution Comp Num.html

# 2. Save the file (Ctrl + S)

# 3. Run migration script
cd D:\complete_quiz_for-Hosting_ver-2-0-0
npm run migrate:content:validate    # Optional: verify file paths
npm run migrate:content:dry         # Preview changes
npm run migrate:content             # Apply to MongoDB

# 4. Git commit + push (for HTML source tracking)
git add content/HSC/Math/3A/3A_Q01-Q02_Solution_Comp_Num.html
git commit -m "Update 3A Q01-Q02 solution"
git push origin main

# 5. Verify production
# Browser: Hard refresh quiz-program.pages.dev
Expected Migration Output:

text
✅ Updated: HSC-Math-3A-Q01-Q02 → v2

📊 Migration Summary
   Created:  0
   Updated:  1
   Skipped:  14
   Failed:   0
Time: ~30 seconds total (migration is instant, Git push optional)

Scenario 2: Update CSS/JS (Frontend Code)
When: Updating styles or JavaScript

Steps:

powershell
# 1. Edit CSS/JS in VSCode
code frontend/css/academia.css
code frontend/js/pages/academia.js

# 2. Save

# 3. Git commit + push (Cloudflare auto-deploys)
git add frontend/
git commit -m "Update academia styles"
git push origin main

# 4. Wait ~1 min for Cloudflare deploy

# 5. Browser: Empty Cache and Hard Reload
Note: Migration script NOT needed — frontend code deploys directly।

Scenario 3: Add New Content
When: Adding a new topic

Steps:

Step 1: Create HTML file

text
content/HSC/Math/3B/3B Q18.html
Step 2: Add metadata entry

Edit backend/scripts/content-metadata.json:

json
{
  "topicId": "HSC-Math-3B-Q18",
  "name": "জটিল সংখ্যা - প্রশ্ন ১৮ সমাধান",
  "category": {
    "board": "HSC",
    "className": "উচ্চতর গণিত",
    "subject": "জটিল সংখ্যা",
    "chapter": "৩(B)",
    "topic": "প্রশ্ন ১৮"
  },
  "filePath": "HSC/Math/3B/3B Q18.html",
  "tags": ["complex-numbers", "exercise-3B"]
}
Step 3: Validate + migrate

powershell
npm run migrate:content:validate    # Verify file exists
npm run migrate:content             # Create in MongoDB
Step 4: Update frontend navigation (optional)

Edit frontend/js/pages/academia.js — add to CHAPTER_DATA:

javascript
{
  id: 'HSC-Math-3B-Q18',
  name: 'প্রশ্ন ১৮ সমাধান',
  icon: '✅',
  type: 'note'
}
Step 5: Commit + push

powershell
git add content/HSC/Math/3B/3B_Q18.html
git add backend/scripts/content-metadata.json
git add frontend/js/pages/academia.js
git commit -m "Add HSC Math 3B Q18"
git push origin main
Scenario 4: Backend Code Change
When: Updating API logic

powershell
# 1. Edit backend code
code backend/controllers/contentController.js

# 2. Commit + push
git add backend/
git commit -m "Update content controller"
git push origin main

# 3. Wait ~2 min for Render auto-deploy

# 4. Verify API
Invoke-RestMethod https://quiz-program.onrender.com/api/v1/health
📋 Command Cheatsheet
Daily Development
powershell
# Navigate to project
cd D:\complete_quiz_for-Hosting_ver-2-0-0

# Start backend (Terminal 1)
npm run dev

# Start frontend (Terminal 2)
npm run serve:frontend

# Open browser
# http://127.0.0.1:3000
Content Migration
powershell
# Validate metadata + file paths (no DB connection)
npm run migrate:content:validate

# Dry run (preview changes)
npm run migrate:content:dry

# Live migration (apply changes)
npm run migrate:content

# Verbose mode (detailed output)
npm run migrate:content:verbose
Git Operations
powershell
# Check status
git status

# Stage specific files
git add <file-path>

# Stage all changes
git add -A

# Commit
git commit -m "Message"

# Push
git push origin main

# View recent commits
git log --oneline -10
API Testing
powershell
# Health check
Invoke-RestMethod https://quiz-program.onrender.com/api/v1/health

# Content stats
Invoke-RestMethod https://quiz-program.onrender.com/api/v1/content/stats/summary | ConvertTo-Json -Depth 3

# Single content
Invoke-RestMethod https://quiz-program.onrender.com/api/v1/content/HSC-Math-3A-Q01-Q02

# Categories
Invoke-RestMethod https://quiz-program.onrender.com/api/v1/content/categories

# Filter
Invoke-RestMethod "https://quiz-program.onrender.com/api/v1/content?chapter=৩(A)"
Cache Clearing (Browser)
Shortcut	Purpose
Ctrl + Shift + R	Hard refresh (memory cache)
F12 → Reload button right-click → Empty Cache and Hard Reload	Full cache clear
F12 → Application → Clear site data	Nuclear option
Ctrl + Shift + N	Incognito (fresh state)
🐛 Troubleshooting Guide
Issue 1: Content Not Updating in Production
Symptoms:

Local shows new content

Production shows old content

Hard refresh doesn't help

Diagnosis:

powershell
# Check MongoDB version
Invoke-RestMethod https://quiz-program.onrender.com/api/v1/content/HSC-Math-3A-Q01-Q02 | Select-Object -ExpandProperty data | Select-Object version, updatedAt
If version is old:

✅ Migration script not run

Fix: npm run migrate:content

If version is new:

⚠️ Browser cache issue

Fix: Incognito OR "Empty Cache and Hard Reload"

Issue 2: Migration Script Fails
Error: "File not found"

Cause: Filename mismatch or folder path wrong

Fix:

powershell
# Verify file exists
Test-Path "content/HSC/Math/3A/3A Q01-Q02 Solution Comp Num.html"

# Check metadata JSON path
Get-Content backend/scripts/content-metadata.json | Select-String "3A Q01"

# Run validation to see which files are missing
npm run migrate:content:validate
Issue 3: CORS Error
Error:

text
Access to fetch at 'https://quiz-program.onrender.com/...' 
from origin '...' has been blocked by CORS policy
Cause: Origin not in backend allowlist

Fix:

Check backend/config/cors.js — ensure origin is allowed:

https://quiz-program.pages.dev (production)

https://*.quiz-program.pages.dev (preview URLs)

http://localhost:3000 (local dev)

http://127.0.0.1:3000 (local dev)

Test CORS:

powershell
Invoke-WebRequest -Uri "https://quiz-program.onrender.com/api/v1/health" `
  -Headers @{ "Origin" = "https://quiz-program.pages.dev" } `
  -Method GET | Select-Object -ExpandProperty Headers
Expected: access-control-allow-origin: https://quiz-program.pages.dev

Issue 4: Render Backend Sleeping
Symptom: First request takes 30-60 seconds

Cause: Render free tier sleeps after 15 min inactivity

Fix:

Set up UptimeRobot:

https://uptimerobot.com → Sign up (free)

Add monitor: https://quiz-program.onrender.com/api/v1/health

Interval: 5 minutes

This pings backend every 5 min → prevents sleep

Issue 5: Cloudflare Cache Stale
Symptom: Old JS/CSS serving even after deploy

Cause: _headers cache TTL

Fix:

Edit frontend/_headers:

text
/*.html
  Cache-Control: public, max-age=0, must-revalidate

/css/*
  Cache-Control: public, max-age=300, must-revalidate

/js/*
  Cache-Control: public, max-age=300, must-revalidate
Then commit + push.

📈 Future Content Migration
Migrating Remaining 41 Files
Current status:

Folder	Files	Status
HSC/Math/3A	8	✅ Migrated
HSC/Math/3B	7	✅ Migrated
HSC/Math/Okkhorpotro	23	🆕 Ready
HSC/Math/Systech	18	🆕 Ready
Total	56	15 done
Migration Template
For each new content file, add entry to backend/scripts/content-metadata.json:

json
{
  "topicId": "<UNIQUE-ID>",
  "name": "<Bengali name>",
  "category": {
    "board": "HSC",
    "className": "উচ্চতর গণিত",
    "subject": "<subject>",
    "chapter": "<chapter>",
    "topic": "<topic>"
  },
  "filePath": "<relative path from content/>",
  "tags": ["<tag1>", "<tag2>"]
}
topicId Naming Convention
text
<Board>-<Subject>-<Publisher>-<Chapter>-<Topic>

Examples:
- HSC-Math-Okkhorpotro-1st-Differ-9A
- HSC-Math-Okkhorpotro-2nd-Complex-3A-Q01
- HSC-Math-Systech-1st-Trigono-CH6-6A
Bulk Migration Steps
List all unmigrated files

powershell
Get-ChildItem content/HSC/Math/Okkhorpotro -Recurse -Filter "*.html" | 
  Select-Object -ExpandProperty Name
Add metadata entries (one per file)

Validate:

powershell
npm run migrate:content:validate
Migrate:

powershell
npm run migrate:content
Update frontend navigation (CHAPTER_DATA in academia.js)

Commit + push

💡 Key Learnings
Architecture Principles
Content ≠ Code

Content: content/ folder → MongoDB (data)

Code: frontend/ + backend/ → Deploy directly

Idempotent Migration

Content hash detects changes

Safe to run multiple times

Only updates what's changed

Separation of Concerns

Data layer (MongoDB)

API layer (Express)

UI layer (Frontend)

Source layer (content/ folder)

Zero-Downtime Deployment

Git push → auto-deploy

No manual intervention

Rollback available

Debugging Workflow
text
1. Problem detected
   ↓
2. Local vs Production? → Check environment
   ↓
3. If local works, prod doesn't:
   ├── Deploy issue? → Check Render/Cloudflare logs
   ├── Cache issue? → Incognito test
   └── Data issue? → Check API response
   ↓
4. If prod works, local doesn't:
   ├── Env var issue? → Check .env
   └── Code not synced? → git pull
Cache Hierarchy (Browser)
text
┌─────────────────────────────────────┐
│  1. Memory cache (fastest)          │ ← Ctrl+Shift+R bypasses
├─────────────────────────────────────┤
│  2. Disk cache                      │ ← Ctrl+Shift+R bypasses
├─────────────────────────────────────┤
│  3. Service Worker cache            │ ← ONLY "Empty Cache + Hard Reload"
├─────────────────────────────────────┤
│  4. HTTP cache (ETag/Last-Modified) │ ← Server-side headers control
├─────────────────────────────────────┤
│  5. Cloudflare CDN cache            │ ← Purge via dashboard
└─────────────────────────────────────┘
Common Pitfalls
Pitfall	Solution
Forgot migration after HTML edit	Run npm run migrate:content
Browser shows old content	"Empty Cache and Hard Reload"
CORS error on preview URL	Update backend/config/cors.js regex
Backend sleeping	UptimeRobot ping every 5 min
Metro debug shows no output	Check specific port (5000 vs 3000)
📞 Quick Reference
File Locations
text
D:\complete_quiz_for-Hosting_ver-2-0-0\
├── content\                          ← HTML source files
├── content-backup\                   ← Temporary backup (gitignored)
├── backend\
│   ├── models\Content.js             ← MongoDB schema
│   ├── controllers\contentController.js ← API logic
│   ├── routes\contentRoutes.js       ← Route definitions
│   └── scripts\
│       ├── migrate-content.js        ← Migration script
│       └── content-metadata.json     ← Config
├── frontend\
│   ├── css\
│   ├── js\
│   │   ├── services\ContentService.js ← API client
│   │   └── pages\academia.js         ← Page logic
│   └── pages\academia.html
└── docs\
    └── content-management.md         ← This file
Environment URLs
Environment	Backend	Frontend
Local	http://localhost:5000	http://127.0.0.1:3000
Production	https://quiz-program.onrender.com	https://quiz-program.pages.dev
Dashboards
Service	URL
Render	https://dashboard.render.com
Cloudflare	https://dash.cloudflare.com
MongoDB Atlas	https://cloud.mongodb.com
GitHub	https://github.com/Ariful-Islam-bd/quiz-program
End of Document

এই document session-এর সব learning capture করে। কোনো feature যোগ করার আগে বা debugging-এ আটকে গেলে এখানে return করুন।

Last Updated: 2026-10-11
Next Review: When adding new content types or major features