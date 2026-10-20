
# Quiz Content Addition Guide

> **Purpose:** নতুন প্রশ্ন কুইজে যোগ করার সম্পূর্ণ workflow
> **Files Involved:** `assortedData.js`, `mainQuizData.js`
> **Last Updated:** 2026-10-20

---

## 📋 Overview — ২টা File-এ Data Add করতে হবে

| File | Purpose | Key Structure |
|------|---------|---------------|
| **`assortedData.js`** | Quiz Index (কোন প্রশ্ন কোন ফিল্টারে আছে) | Nested object: Board → Class → Subject → Chapter → Exercise → [Question IDs] |
| **`mainQuizData.js`** | Question Content (প্রশ্নের বিস্তারিত) | Array of objects: { id, q, options, answer, explain, marks } |

**Critical Rule:** দুই ফাইলেই **একই Question ID** থাকতে হবে।

---

## 🎯 Step-by-Step Workflow

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### 📝 STEP 1: Question ID তৈরি করুন
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Naming Convention:**
<Board><Class><Subject><Chapter><Exercise>_<Type>_q<Number>

Examples:

class9_gmath_ch2_exer2.1_q0301

hsc_ict_ch3_exer3_1_q0325

class9_eng2_ch2_blank_q0221

text

**Sub-questions (Group MCQ):**
<Base ID>-sq1 <Base ID>-sq2 Example: class9_gmath_ch2_exer2.1_q0301-sq1-sq2 ```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 STEP 2: mainQuizData.js — Question Content Add করুন
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File Open:

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
code mainQuizData.js
Array-এর শেষ }; খুঁজুন → তার আগে new question object paste করুন।

Template — Single MCQ:

javascript
{
    id: "class9_gmath_ch2_exer2.1_q0301",
    group: false,
    stimulant: "",
    q: "প্রশ্নের লেখা এখানে (MathML বা HTML সহ)",
    type: "MCQ",
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: [0],              // সঠিক option-এর index (0-based)
    explain: ["ব্যাখ্যা এখানে"],
    marks: 1
},
Template — Group MCQ (Stimulant সহ):

javascript
{
    id: "class9_gmath_ch2_exer2.1_q0302",
    group: true,
    stimulant: "উদ্দীপক বা stimulant text/SVG এখানে",
    questions: [
        { subId: "sq1", order: 1, q: "প্রশ্ন ১?", type: "MCQ", options: ["A", "B", "C", "D"], answer: [0], explain: "", marks: 1 },
        { subId: "sq2", order: 2, q: "প্রশ্ন ২?", type: "MCQ", options: ["A", "B", "C", "D"], answer: [2], explain: "", marks: 1 }
    ]
},
Template — Blank-Type-A (Word Box):

javascript
{
    id: "class9_eng2_ch2_blank_q0221",
    group: false,
    stimulant: "",
    instruction: "Read the text below and complete it with suitable words given in the box.",
    q: "The text with __Aa__ placeholders...",
    type: "Blank-Type-A",
    options: ["word1", "word2", "word3", "word4", "word5"],
    answer: [0, 1, 2, 3, 4],   // Index of correct word per blank
    explain: [
        {"word": "word1", "desc": "Explanation for blank 1"},
        {"word": "word2", "desc": "Explanation for blank 2"}
    ],
    marks: 5
},
Template — Blank-Type-B (Preposition):

javascript
{
    id: "class9_eng2_ch1_blank_q0209",
    group: false,
    stimulant: "",
    instruction: "Read the text below and complete it with prepositions.",
    q: "A student should concentrate ____ his studies...",
    type: "Blank-Type-B",
    answer: [],       // Preposition list (e.g., ["on", "in", "to", "at", "for"])
    explain: [],
    marks: 5
},
Save করুন (Ctrl + S)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 STEP 3: assortedData.js — Index Entry Add করুন
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File Open:

powershell
code assortedData.js
Appropriate hierarchy-তে question ID add করুন।

Example 1: ৯ম-১০ম গণিত অধ্যায় ২.১-এ নতুন প্রশ্ন

javascript
"জাতীয় শিক্ষাবোর্ড": {
    "৯ম ও ১০ম শ্রেণি": {
        "সাধারণ গণিত": {
            "অধ্যায় ২ (সেট ও ফাংশন), অনুশীলনী ২.১": {
                "অনুশীলনী ২.১ টেস্ট ১": [
                    // ... existing questions
                    "class9_gmath_ch2_exer2.1_q0001",
                    // ...
                    "class9_gmath_ch2_exer2.1_q0030",
                    
                    // 🆕 NEW QUESTIONS — এখানে add করুন
                    "class9_gmath_ch2_exer2.1_q0301",
                    "class9_gmath_ch2_exer2.1_q0302-sq1-sq2"  // Group MCQ
                ],
            },
        },
    },
},
Example 2: নতুন Exercise যোগ করা

javascript
"অধ্যায় ২ (সেট ও ফাংশন), অনুশীলনী ২.১": {
    "অনুশীলনী ২.১ টেস্ট ১": [...existing...],
    "অনুশীলনী ২.১ টেস্ট ২": [...existing...],
    // ... existing tests
    
    // 🆕 NEW TEST — সম্পূর্ণ নতুন exercise
    "অনুশীলনী ২.১ টেস্ট ৮": [
        "class9_gmath_ch2_exer2.1_q0301",
        "class9_gmath_ch2_exer2.1_q0302-sq1-sq2",
        "class9_gmath_ch2_exer2.1_q0303",
        // ... more
    ],
},
Save করুন (Ctrl + S)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 STEP 4: Syntax Verify করুন (Local Test)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PowerShell-এ File syntax চেক করুন:

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0

# Verify assortedData.js syntax
node -c assortedData.js

# Verify mainQuizData.js syntax
node -c mainQuizData.js
Expected Output: কিছুই দেখাবে না (silent success)।

⚠️ যদি Error আসে:

text
SyntaxError: Unexpected token ...
→ Manually check করুন — missing comma, bracket, quote.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 STEP 5: Local Test — Question Load Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Node.js দিয়ে Verify করুন question data loaded হয় কিনা:

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0

# Test: assortedData.js load হয় কিনা
node -e "const { ASSORTED_QUIZ_INDEX } = require('./assortedData.js'); console.log('✅ assortedData loaded:', Object.keys(ASSORTED_QUIZ_INDEX).length, 'boards');"

# Test: mainQuizData.js load হয় কিনা
node -e "const { MAIN_QUIZ_DATA_MAP } = require('./mainQuizData.js'); console.log('✅ mainQuizData loaded:', MAIN_QUIZ_DATA_MAP.length, 'questions');"
Expected Output:

text
✅ assortedData loaded: 2 boards
✅ mainQuizData loaded: XXX questions
Specific question verify করুন:

powershell
# New question exists in mainQuizData?
node -e "const { MAIN_QUIZ_DATA_MAP } = require('./mainQuizData.js'); const q = MAIN_QUIZ_DATA_MAP.find(x => x.id === 'class9_gmath_ch2_exer2.1_q0301'); console.log(q ? '✅ Question found: ' + q.q.substring(0, 50) : '❌ Question NOT found');"
Expected:

text
✅ Question found: প্রশ্নের লেখা এখানে...
⚠️ যদি "❌ Question NOT found" দেখায়:

ID mismatch check করুন

Syntax error থাকতে পারে

Comma/quote verify করুন

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 STEP 6: Local Frontend Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Terminal #1 — Backend চালু:

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
npm run dev
Terminal #2 — Frontend চালু (নতুন window):

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
npm run serve:frontend
Browser Test:

Incognito window খুলুন (Ctrl + Shift + N)

http://127.0.0.1:3000 যান

Navigate: Quiz → Board select → Class select → Subject → Chapter → Exercise

Verify: নতুন প্রশ্নগুলো load হচ্ছে কিনা

Test: নতুন exercise select করলে সঠিক questions আসছে কিনা

⚠️ Important — Backend Server-এ Node Modules Reload:

Backend mainQuizData.js এবং assortedData.js use করে। আপনি File edit করেছেন, তাই backend restart করতে হবে।

Terminal #1-এ:

text
Ctrl + C  (server stop)
npm run dev  (server restart)
Expected Console Output:

text
✅ Server running on port 5000
✅ MongoDB Connected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 STEP 7: Git Commit + Push (Deploy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Terminal #3 — Git Commands (নতুন window):

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0

# Step 1: Status check
git status
Expected:

text
modified:   assortedData.js
modified:   mainQuizData.js
Step 2: Stage files:

powershell
git add assortedData.js mainQuizData.js
Step 3: Commit:

powershell
git commit -m "feat(quiz): Add new questions for [subject/chapter]

- Added X new questions to class9_gmath_ch2_exer2.1
- Added new test: অনুশীলনী ২.১ টেস্ট ৮
- Updated both assortedData.js and mainQuizData.js"
⚠️ Commit message customize করুন — কতগুলো প্রশ্ন, কোন chapter.

Step 4: Push:

powershell
git push origin main
Expected:

text
Enumerating objects: X, done.
...
To https://github.com/Ariful-Islam-bd/quiz-program.git
   XXXXXXX..XXXXXXX  main -> main
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☁️ STEP 8: Production Verify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Cloudflare Frontend auto-deploy (~14s) — কিন্তু Backend (Render) auto-deploy (~2min)।

Deploy wait:

powershell
# Terminal-এ deploy monitor (optional)
Write-Host "⏱️ Waiting for Cloudflare deploy..."
Start-Sleep -Seconds 60
Write-Host "✅ Cloudflare deploy likely done"
Verify APIs:

powershell
# Check Render backend is up
Invoke-RestMethod https://quiz-program.onrender.com/api/v1/health | ConvertTo-Json

# Check new questions loaded (from filtered API)
Invoke-RestMethod "https://quiz-program.onrender.com/api/v1/quizzes/filter?board=জাতীয়+শিক্ষাবোর্ড&className=৯ম+ও+১০ম+শ্রেণি&subject=সাধারণ+গণিত&chapter=অধ্যায়+২&exercise=অনুশীলনী+২.১+টেস্ট+৮" | ConvertTo-Json -Depth 3
Expected: New questions JSON-এ return হবে।

Browser Production Test:

Incognito window

https://school-college.pages.dev

Navigate: Quiz → select filters

Verify: নতুন প্রশ্ন load হচ্ছে

Test: সব question render হয়

📋 Complete Command Sequence (Summary)
powershell
# ═══════════════════════════════════════════
# ⚠️ START: File Edit complete করার পর
# ═══════════════════════════════════════════

# 1️⃣ Navigate
cd D:\complete_quiz_for-Hosting_ver-2-0-0

# 2️⃣ Syntax check (both files)
node -c assortedData.js
node -c mainQuizData.js

# 3️⃣ Verify data loads
node -e "const {ASSORTED_QUIZ_INDEX}=require('./assortedData.js'); console.log('✅', Object.keys(ASSORTED_QUIZ_INDEX).length, 'boards')"
node -e "const {MAIN_QUIZ_DATA_MAP}=require('./mainQuizData.js'); console.log('✅', MAIN_QUIZ_DATA_MAP.length, 'questions')"

# 4️⃣ Local Test — Terminal #1 (backend)
npm run dev
# → Ctrl+C দিয়ে restart করুন (আগে চললে)
# → চালু রাখুন

# 5️⃣ Local Test — Terminal #2 (frontend)
npm run serve:frontend
# → http://127.0.0.1:3000 (Incognito)
# → Quiz → verify new questions load

# 6️⃣ Git — Terminal #3
git status
git add assortedData.js mainQuizData.js
git commit -m "feat(quiz): Add new questions"
git push origin main

# 7️⃣ Verify production (~2 min wait)
Invoke-RestMethod https://quiz-program.onrender.com/api/v1/health | ConvertTo-Json
# → https://school-college.pages.dev (Incognito test)
⚠️ Common Issues & Fixes
Issue 1: Syntax Error on node -c
Cause: Missing comma, bracket mismatch, quote mismatch

Fix:

powershell
# Find line number from error
# Example: "Unexpected token at line 1234"
code mainQuizData.js
# → Go to line 1234
# → Check for missing comma before/after
Issue 2: "Question NOT found" in Test
Cause: ID mismatch between assortedData.js and mainQuizData.js

Fix:

powershell
# Verify exact ID match
node -e "const {ASSORTED_QUIZ_INDEX}=require('./assortedData.js'); const board=ASSORTED_QUIZ_INDEX['জাতীয় শিক্ষাবোর্ড']['৯ম ও ১০ম শ্রেণি']['সাধারণ গণিত']['অধ্যায় ২ (সেট ও ফাংশন), অনুশীলনী ২.১']['অনুশীলনী ২.১ টেস্ট ৮']; console.log(board);"

# Compare with mainQuizData
node -e "const {MAIN_QUIZ_DATA_MAP}=require('./mainQuizData.js'); const ids = MAIN_QUIZ_DATA_MAP.filter(q => q.id.includes('q0301')).map(q => q.id); console.log(ids);"
Issue 3: Frontend Shows Old Data
Cause: Backend restart হয়নি, অথবা browser cache

Fix:

powershell
# Terminal #1 (backend) — Ctrl+C
npm run dev

# Browser — Ctrl+Shift+R (hard reload)
# অথবা Incognito
Issue 4: Render Auto-Deploy Failed
Cause: Syntax error (backend)

Fix:

powershell
# Check Render dashboard
# https://dashboard.render.com → Logs

# Or local debug
node -c assortedData.js
node -c mainQuizData.js
Issue 5: Question Shows But Blank
Cause: q field empty, অথবা MathML render issue

Fix:

powershell
# Verify q field
node -e "const {MAIN_QUIZ_DATA_MAP}=require('./mainQuizData.js'); const q=MAIN_QUIZ_DATA_MAP.find(x => x.id === 'YOUR_QUESTION_ID'); console.log('q:', q?.q); console.log('options:', q?.options); console.log('answer:', q?.answer);"
📊 Quick Reference — Question Types
Type	Group?	Fields Required
MCQ	false	id, q, type, options, answer, explain, marks
Group MCQ	true	id, stimulant, questions[] (each: subId, order, q, type, options, answer, marks)
Blank-Type-A	false	id, instruction, q, type, options, answer, explain, marks
Blank-Type-B	false	id, instruction, q, type, answer, explain, marks
Sentence-Rearranging	false	id, q, type, options, answer, explain, marks
🎯 Best Practices
✅ DO:
✅ একবারে ১০-২০টা প্রশ্ন add করুন (bulk efficient)

✅ Same exercise-এ সব প্রশ্ন রাখুন

✅ ID suffix follow করুন (q0301, q0302, ইত্যাদি)

✅ Sub-question IDs স্পষ্ট রাখুন (-sq1-sq2)

✅ Commit-এ description দিন (কোন chapter-এ কী যোগ হয়েছে)

❌ DON'T:
❌ একবারে একটা প্রশ্ন (10 commits unnecessary)

❌ Duplicate ID (same ID দুইবার)

❌ Missing comma between objects

❌ Backend restart ছাড়া deploy (local test-এ stale data)

🚀 Quick Test Script (Optional)
scripts/test-quiz-data.js তৈরি করে রাখুন:

javascript
// scripts/test-quiz-data.js
const { ASSORTED_QUIZ_INDEX } = require('../assortedData.js');
const { MAIN_QUIZ_DATA_MAP } = require('../mainQuizData.js');

console.log('═══════════════════════════════════════');
console.log('📊 Quiz Data Verification');
console.log('═══════════════════════════════════════');

console.log('Assorted boards:', Object.keys(ASSORTED_QUIZ_INDEX).length);
console.log('Quiz questions:', MAIN_QUIZ_DATA_MAP.length);

// Check all IDs in assorted exist in mainQuizData
const mainIds = new Set(MAIN_QUIZ_DATA_MAP.map(q => q.id));
const groupMainIds = new Set();
MAIN_QUIZ_DATA_MAP.forEach(q => {
    if (q.group && q.questions) {
        q.questions.forEach(sq => {
            groupMainIds.add(`${q.id}-${sq.subId}`);
        });
    }
});
const allMainIds = new Set([...mainIds, ...groupMainIds]);

let orphans = 0;
function checkHierarchy(obj, path = '') {
    for (const key in obj) {
        const val = obj[key];
        if (Array.isArray(val)) {
            val.forEach(id => {
                if (!allMainIds.has(id)) {
                    console.log(`❌ ORPHAN: ${path}/${key} → ${id}`);
                    orphans++;
                }
            });
        } else if (typeof val === 'object') {
            checkHierarchy(val, `${path}/${key}`);
        }
    }
}
checkHierarchy(ASSORTED_QUIZ_INDEX);

console.log('═══════════════════════════════════════');
console.log(orphans === 0 ? '✅ All IDs match!' : `❌ ${orphans} orphan IDs found`);
console.log('═══════════════════════════════════════');
Run:

powershell
node scripts/test-quiz-data.js
📝 Report Format
সব complete হলে জানান:

text
✅ Files modified: assortedData.js, mainQuizData.js
✅ Syntax check: Pass
✅ Local test: Pass (questions load)
✅ Git commit: XXXXXXX
✅ Git push: Success
✅ Cloudflare deploy: Success
✅ Render deploy: Success
✅ Production verify: Pass
Document Version: 1.0.0
Last Updated: 2026-10-20
Maintainer: Ariful Islam

text

---

**Save করুন:** `Ctrl + S` → `D:\complete_quiz_for-Hosting_ver-2-0-0\docs\quiz-content-addition-guide.md`

---

## 🎯 সংক্ষিপ্ত সারসংক্ষেপ — আপনার জন্য

**File Edit Complete হলে এই ৬টা Command চালান (Step-by-Step):**

### **Terminal #3 (যেকোনো PowerShell):**

```powershell
# Step 1: Syntax check
cd D:\complete_quiz_for-Hosting_ver-2-0-0
node -c assortedData.js
node -c mainQuizData.js

# Step 2: Data verify
node -e "const {MAIN_QUIZ_DATA_MAP}=require('./mainQuizData.js'); console.log(MAIN_QUIZ_DATA_MAP.length, 'questions')"
Terminal #1 — Backend Restart:
powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
npm run dev
# যদি already running থাকে: Ctrl+C → আবার npm run dev
Terminal #2 — Frontend (যদি চলছে):
powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
npm run serve:frontend
Browser Test:
text
http://127.0.0.1:3000 (Incognito)
→ Quiz → filter select → new questions visible?
Terminal #3 — Deploy:
powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
git add assortedData.js mainQuizData.js
git commit -m "feat(quiz): Add new questions"
git push origin main
Wait ~2 min → Production Test:
text
https://school-college.pages.dev (Incognito)
→ Quiz → new questions visible?
এই workflow save করে রাখুন — প্রতিবার নতুন প্রশ্ন যোগ করার সময় follow করবেন! 📋

File docs/quiz-content-addition-guide.md-এ save করুন।

